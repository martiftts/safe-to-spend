import { Injectable, signal } from '@angular/core';
import { AgentState, Archetype, UserProfile, StepAnswer } from '../models/profile.model';
import { environment } from '../../environments/environment';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5';
const TIMEOUT_MS = 15000;

type WorkflowStatus = 'idle' | 'step1' | 'step2' | 'step3' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class ClaudeService {
  readonly status = signal<WorkflowStatus>('idle');
  readonly error = signal<string | null>(null);

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
    return this.toProfile(state);
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
    const system = `Sei un assistente educativo finanziario. NON dai consigli finanziari.
Analizza le risposte e identifica il pain point finanziario dominante.
Rispondi SOLO con JSON: {"painPoint":"<1 frase>","summary":"<2 frasi>"}
Max 50 parole totali. Nessun testo aggiuntivo.`;

    const user = JSON.stringify({ answers: state.answers });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step1']>(text);
  }

  private async step2(state: AgentState): Promise<AgentState['step2']> {
    const system = `Sei un assistente educativo finanziario. NON dai consigli finanziari.
Classifica l'utente: novice (0-8), aware (9-14), practitioner (15-20).
Rispondi SOLO con JSON: {"archetype":"novice"|"aware"|"practitioner","score":<0-20>,"rationale":"<1 frase max 30 parole>"}
Nessun testo aggiuntivo.`;

    const user = JSON.stringify({
      answers: state.answers,
      painPoint: state.step1?.painPoint,
    });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step2']>(text);
  }

  private async step3(state: AgentState): Promise<AgentState['step3']> {
    const system = `Sei un assistente educativo finanziario. NON dai consigli finanziari né di investimento.
Genera 3 micro-contenuti educativi per l'archetype e il pain point.
Rispondi SOLO con JSON: {"lessons":[{"title":"<titolo>","body":"<max 40 parole>","emoji":"<emoji>"},...],"nextStep":"<1 frase>"}
Max 150 parole totali. Nessun testo aggiuntivo.`;

    const user = JSON.stringify({
      archetype: state.step2?.archetype,
      painPoint: state.step1?.painPoint,
    });
    const text = await this.callClaude(system, user);
    return this.parseJson<AgentState['step3']>(text);
  }

  private fallbackStep1(state: AgentState): AgentState['step1'] {
    const difficultyAnswer = state.answers[4]?.answer ?? 'spese quotidiane';
    return {
      painPoint: `L'utente ha difficoltà con: ${difficultyAnswer}`,
      summary: 'Profilo determinato tramite analisi locale. Alcune aree di miglioramento identificate.',
    };
  }

  private fallbackStep2(state: AgentState): AgentState['step2'] {
    let score = 0;
    const a = state.answers;
    if (a[1]?.answer === 'discreta' || a[1]?.answer === 'buona') score += 5;
    if (a[2]?.answer === 'si') score += 3;
    if (a[3]?.answer === 'si poco' || a[3]?.answer === 'si piano') score += 4;
    if (a[5]?.answer === 'si') score += 5;
    else if (a[5]?.answer === 'vagamente') score += 2;

    const archetype: Archetype = score >= 15 ? 'practitioner' : score >= 9 ? 'aware' : 'novice';
    const rationale =
      archetype === 'novice'
        ? 'Bassa familiarità con la finanza e strumenti di gestione.'
        : archetype === 'aware'
          ? 'Conosce qualcosa, ha un conto ma non gestisce attivamente.'
          : 'Gestisce già entrate e uscite, conosce i termini base.';

    return { archetype, score, rationale };
  }

  private fallbackStep3(state: AgentState): AgentState['step3'] {
    const archetype = state.step2?.archetype ?? 'novice';
    const lessons =
      archetype === 'novice'
        ? [
            { title: 'Cos\'è il netto in busta paga', body: 'Il netto è quello che ricevi davvero. Dal lordo si tolgono tasse e contributi obbligatori — quei soldi non sono mai stati tuoi.', emoji: '💰' },
            { title: 'Il conto corrente è sicuro', body: 'I soldi sul conto sono garantiti fino a €100.000. Usarlo non costa niente per i pagamenti di base.', emoji: '🏦' },
            { title: 'Inizia a tracciare le spese', body: 'Scrivi ogni spesa per 1 settimana. Non devi cambiare niente — solo capire dove va il denaro.', emoji: '📝' },
          ]
        : archetype === 'aware'
          ? [
              { title: 'INPS e IRPEF: cosa sono', body: 'INPS è la tua pensione futura. IRPEF è la tassa sul reddito. Entrambi vengono trattenuti prima che tu veda il netto.', emoji: '📋' },
              { title: 'Il TFR non è perso', body: 'Il TFR (Trattamento Fine Rapporto) è un risparmio forzato. Lo ricevi quando lasci il lavoro — è tuo.', emoji: '🔒' },
              { title: 'Regola del 50/30/20', body: '50% spese fisse, 30% variabili, 20% risparmio. Un punto di partenza per organizzare il budget mensile.', emoji: '📊' },
            ]
          : [
              { title: 'Simula il tuo safe to spend', body: 'Prendi il netto mensile. Sottrai tutte le spese fisse. Il resto è il tuo "safe to spend" — quello che puoi spendere o risparmiare.', emoji: '🧮' },
              { title: 'Fondo emergenze: 3 mesi di spese', body: 'Un fondo emergenze copre imprevisti senza indebitarsi. L\'obiettivo standard: 3 mesi di spese fisse in liquidità.', emoji: '🛡️' },
              { title: 'Inflazione e potere d\'acquisto', body: 'Se l\'inflazione è al 3% e i tuoi risparmi non crescono, perdi potere d\'acquisto ogni anno. Capire questo aiuta a pianificare.', emoji: '📈' },
            ];

    return {
      lessons,
      nextStep: 'Calcola il tuo safe to spend mensile sottraendo tutte le spese fisse dal netto in busta paga.',
    };
  }

  private toProfile(state: AgentState): UserProfile {
    return {
      archetype: state.step2!.archetype,
      score: state.step2!.score,
      painPoint: state.step1!.painPoint,
      summary: state.step1!.summary,
      rationale: state.step2!.rationale,
      lessons: state.step3!.lessons,
      nextStep: state.step3!.nextStep,
    };
  }
}
