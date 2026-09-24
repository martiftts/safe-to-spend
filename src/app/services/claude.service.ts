import { Injectable, signal } from '@angular/core';
import { AgentState, SpendingProfile, UserProfile, StepAnswer } from '../models/profile.model';
import { environment } from '../../environments/environment';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5';
const TIMEOUT_MS = 15000;

type WorkflowStatus = 'idle' | 'step1' | 'step2' | 'step3' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class ClaudeService {
  readonly status = signal<WorkflowStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly profile = signal<UserProfile | null>(null);

  private apiKey = environment.claudeApiKey;

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async runWorkflow(answers: StepAnswer[]): Promise<UserProfile> {
    this.status.set('step1');
    this.error.set(null);
    const state: AgentState = { answers };

    try {
      state.step1 = await this.step1(state);
    } catch {
      state.step1 = this.fallbackStep1(state);
    }

    this.status.set('step2');
    try {
      state.step2 = await this.step2(state);
    } catch {
      state.step2 = this.fallbackStep2(state);
    }

    this.status.set('step3');
    try {
      state.step3 = await this.step3(state);
    } catch {
      state.step3 = this.fallbackStep3(state);
    }

    this.status.set('done');
    const result = this.toProfile(state);
    this.profile.set(result);
    return result;
  }

  private async callClaude(systemPrompt: string, userContent: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(CLAUDE_API, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 512,
          thinking: { type: 'adaptive' },
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        }),
      });

      if (!res.ok) throw new Error(`Claude API ${res.status}`);
      const data = await res.json();
      const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
      return textBlock?.text ?? '';
    } finally {
      clearTimeout(timer);
    }
  }

  private parseJson<T>(text: string): T {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    return JSON.parse(match[0]) as T;
  }

  private async step1(state: AgentState): Promise<AgentState['step1']> {
    const system = `Sei un assistente per la gestione delle spese personali. NON dai consigli finanziari né di investimento.
Analizza le informazioni sul nucleo familiare, entrate e uscite dell'utente.
Rispondi SOLO con JSON: {"safeToSpend":"<importo stimato es. circa €700/mese>","summary":"<2 frasi in seconda persona, parla direttamente all'utente usando 'tu'>"}
Max 60 parole. Nessun testo aggiuntivo.`;

    const user = JSON.stringify({ answers: state.answers });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step1']>(text);
  }

  private async step2(state: AgentState): Promise<AgentState['step2']> {
    const system = `Classifica il profilo di spesa dell'utente.
- tightly_budgeted: margine ridotto, spese fisse vicine alle entrate
- balanced: buon equilibrio, piccolo margine di risparmio
- comfortable: ampio margine, può permettersi flessibilità
Rispondi SOLO con JSON: {"spendingProfile":"tightly_budgeted"|"balanced"|"comfortable","rationale":"<1 frase in seconda persona, max 25 parole>"}
Nessun testo aggiuntivo.`;

    const user = JSON.stringify({
      answers: state.answers,
      safeToSpend: state.step1?.safeToSpend,
    });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step2']>(text);
  }

  private async step3(state: AgentState): Promise<AgentState['step3']> {
    const system = `Sei un assistente per la gestione delle spese quotidiane. NON dai consigli finanziari né di investimento.
Genera consigli pratici sulle spese per questo utente specifico.
Usa il "tu" — parla direttamente, mai in terza persona.
Rispondi SOLO con JSON:
{"canSpendOn":["<cosa puoi permetterti 1>","<cosa puoi permetterti 2>","<cosa puoi permetterti 3>"],"avoid":["<cosa evitare 1>","<cosa evitare 2>","<cosa evitare 3>"],"nextStep":"<1 frase: azione concreta che puoi fare subito>"}
Sii specifico al nucleo familiare e al margine disponibile. NON consigliare prodotti, banche o investimenti. Nessun testo aggiuntivo.`;

    const user = JSON.stringify({
      answers: state.answers,
      safeToSpend: state.step1?.safeToSpend,
      spendingProfile: state.step2?.spendingProfile,
    });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step3']>(text);
  }

  // ── Fallback locale ──────────────────────────────────────────────

  private estimateSafeToSpend(answers: StepAnswer[]): number {
    const incomeMap: Record<string, number> = { '<1000': 750, '1000-2000': 1500, '2000-3500': 2750, '>3500': 4000 };
    const expMap: Record<string, number> = { '<400': 300, '400-800': 600, '800-1400': 1100, '>1400': 1600 };
    const debtMap: Record<string, number> = { 'no': 0, 'si-piccoli': 150, 'si-significativi': 350 };

    const income = incomeMap[answers[1]?.answer] ?? 1500;
    const expenses = expMap[answers[2]?.answer] ?? 600;
    const debts = debtMap[answers[3]?.answer] ?? 0;
    return Math.max(0, income - expenses - debts);
  }

  private fallbackStep1(state: AgentState): AgentState['step1'] {
    const safe = this.estimateSafeToSpend(state.answers);
    const family = state.answers[0]?.answer ?? 'solo';
    const familyLabel: Record<string, string> = {
      solo: 'vivi da solo',
      coppia: 'vivete in coppia',
      'famiglia-piccola': 'avete una famiglia con figli',
      'famiglia-grande': 'avete una famiglia numerosa',
    };
    return {
      safeToSpend: `circa €${safe}/mese`,
      summary: `Considerando che ${familyLabel[family] ?? 'vivi da solo'}, il tuo margine mensile disponibile dopo le spese fisse è stimato in €${safe}. Questa è la cifra su cui puoi ragionare per le spese quotidiane.`,
    };
  }

  private fallbackStep2(state: AgentState): AgentState['step2'] {
    const safe = this.estimateSafeToSpend(state.answers);
    let spendingProfile: SpendingProfile;
    let rationale: string;

    if (safe < 300) {
      spendingProfile = 'tightly_budgeted';
      rationale = 'Il tuo margine è ridotto: ogni spesa va valutata con attenzione.';
    } else if (safe < 800) {
      spendingProfile = 'balanced';
      rationale = 'Hai un buon equilibrio: puoi permetterti qualche spesa extra con giudizio.';
    } else {
      spendingProfile = 'comfortable';
      rationale = 'Hai ampio margine disponibile: puoi permetterti flessibilità nelle spese.';
    }

    return { spendingProfile, rationale };
  }

  private fallbackStep3(state: AgentState): AgentState['step3'] {
    const profile = state.step2?.spendingProfile ?? 'balanced';
    const family = state.answers[0]?.answer ?? 'solo';
    const futurePlans = state.answers[5]?.answer ?? 'no';
    const hasFuturePlans = futurePlans !== 'no';

    const adviceMap: Record<SpendingProfile, { canSpendOn: string[]; avoid: string[] }> = {
      tightly_budgeted: {
        canSpendOn: [
          'Spesa alimentare settimanale pianificata con lista',
          'Trasporti necessari (abbonamento vs. singoli biglietti)',
          'Una piccola uscita mensile programmata',
        ],
        avoid: [
          'Acquisti impulsivi fuori budget',
          hasFuturePlans ? 'Spese non pianificate: stai accantonando per quella spesa futura' : 'Spese voluttuarie non essenziali',
          family === 'solo' ? 'Abbonamenti che non usi davvero' : 'Spese extra per i bambini non pianificate',
        ],
      },
      balanced: {
        canSpendOn: [
          'Uscite sociali una-due volte a settimana',
          'Piccoli acquisti per la casa o il benessere',
          hasFuturePlans ? 'Accantonamento mensile per la spesa futura pianificata' : 'Un piccolo risparmio mensile',
        ],
        avoid: [
          'Acquisti grandi non pianificati questo mese',
          'Rate nuove se hai già impegni in corso',
          'Spese d\'impulso online (notifiche di offerte)',
        ],
      },
      comfortable: {
        canSpendOn: [
          'Uscite, tempo libero e svago senza senso di colpa',
          hasFuturePlans ? 'Accantona per la spesa futura: hai il margine' : 'Un fondo emergenze mensile',
          family.includes('famiglia') ? 'Attività ed esperienze per tutta la famiglia' : 'Esperienze e viaggi programmati',
        ],
        avoid: [
          'Spese ricorrenti dimenticate (abbonamenti zombie)',
          'Finanziamenti a rate per cose che puoi acquistare subito',
          'Spese non consapevoli: traccia anche tu per capire dove va il denaro',
        ],
      },
    };

    const nextStepMap: Record<SpendingProfile, string> = {
      tightly_budgeted: 'Annota tutte le spese questa settimana per capire dove puoi recuperare margine.',
      balanced: 'Imposta un piccolo accantonamento automatico mensile, anche solo €50.',
      comfortable: 'Controlla gli abbonamenti attivi: probabilmente ne paghi qualcuno che non usi più.',
    };

    return {
      ...adviceMap[profile],
      nextStep: nextStepMap[profile],
    };
  }

  private toProfile(state: AgentState): UserProfile {
    return {
      safeToSpend: state.step1!.safeToSpend,
      summary: state.step1!.summary,
      spendingProfile: state.step2!.spendingProfile,
      rationale: state.step2!.rationale,
      canSpendOn: state.step3!.canSpendOn,
      avoid: state.step3!.avoid,
      nextStep: state.step3!.nextStep,
    };
  }
}
