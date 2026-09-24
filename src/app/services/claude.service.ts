import { Injectable, inject, signal } from '@angular/core';
import { AgentState, Archetype, Lesson, UserProfile, StepAnswer } from '../models/profile.model';
import {
  Step1Schema,
  Step2Schema,
  Step3Schema,
  archetypeFromScore,
  type Degradation,
  type StepTrace,
  type WorkflowTrace,
} from '@schemas/steps';
import { RunModeService } from './run-mode.service';
import { runGuardrail } from './guardrail';
import { allowedValues, factsBlock } from '../data/verified-facts';
import { NO_ADVICE, NO_MORALIZING, NUMERIC_GROUNDING, buildSystemPrompt } from '../data/policy-text';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

/**
 * Model tiering — razionale in ../../../agents/README.md § Model tiering.
 * Lo step 1 è l'unico che richiede un giudizio qualitativo e l'unico il cui
 * output condiziona entrambi gli step successivi.
 */
const MODEL_STEP1 = 'claude-opus-5';
const MODEL_STEP23 = 'claude-haiku-4-5';

/** Limiti — fonte unica: ../../../agents/policies/escalation.md § Tabella dei limiti */
const TIMEOUT_MS = 15_000;
const MAX_NETWORK_RETRIES = 2;
const MAX_REGENERATIONS = 1;

type WorkflowStatus = 'idle' | 'step1' | 'step2' | 'step3' | 'done' | 'error';

class StepFailure extends Error {
  constructor(readonly reason: NonNullable<Degradation>) {
    super(reason);
  }
}

@Injectable({ providedIn: 'root' })
export class ClaudeService {
  private readonly runMode = inject(RunModeService);

  readonly status = signal<WorkflowStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly profile = signal<UserProfile | null>(null);

  /** Tracciato per l'avviso di degradazione e per l'ispezione in demo. */
  readonly trace = signal<WorkflowTrace>({ steps: [], degradedCount: 0 });

  /** Compatibilità con l'API preesistente; delega a RunModeService. */
  setApiKey(key: string): void {
    this.runMode.setApiKey(key);
  }

  async runWorkflow(answers: StepAnswer[]): Promise<UserProfile> {
    this.error.set(null);
    this.trace.set({ steps: [], degradedCount: 0 });
    const state: AgentState = { answers };

    this.status.set('step1');
    state.step1 = await this.execute(1, MODEL_STEP1, () => this.step1(state), () => this.fallbackStep1(state));

    this.status.set('step2');
    state.step2 = await this.execute(2, MODEL_STEP23, () => this.step2(state), () => this.fallbackStep2(state));

    this.status.set('step3');
    state.step3 = await this.execute(3, MODEL_STEP23, () => this.step3(state), () => this.fallbackStep3(state));

    this.status.set('done');
    const result = this.toProfile(state);
    this.profile.set(result);
    return result;
  }

  // ─── Orchestrazione di uno step ──────────────────────────────────────────

  /**
   * In modalità locale non si tenta nemmeno la chiamata: il fallback non è
   * una degradazione ma la configurazione scelta.
   * In modalità live, un fallimento attiva il fallback senza interrompere
   * il workflow (agents/policies/escalation.md).
   */
  private async execute<T>(
    step: 1 | 2 | 3,
    model: string,
    live: () => Promise<T>,
    fallback: () => T,
  ): Promise<T> {
    const started = Date.now();

    if (this.runMode.mode() === 'local') {
      this.record({ step, model: null, degraded: null, attempts: 0, ms: 0 });
      return fallback();
    }

    let attempts = 0;
    for (let regeneration = 0; regeneration <= MAX_REGENERATIONS; regeneration++) {
      attempts++;
      try {
        const value = await live();
        this.record({ step, model, degraded: null, attempts, ms: Date.now() - started });
        return value;
      } catch (e) {
        const reason: NonNullable<Degradation> = e instanceof StepFailure ? e.reason : 'network';
        // Solo output invalido o violazione di policy meritano una rigenerazione:
        // un timeout o un errore di rete non migliorano riprovando subito.
        const worthRetrying = reason === 'invalid-output' || reason === 'policy';
        if (!worthRetrying || regeneration === MAX_REGENERATIONS) {
          this.record({ step, model, degraded: reason, attempts, ms: Date.now() - started });
          return fallback();
        }
      }
    }
    this.record({ step, model, degraded: 'invalid-output', attempts, ms: Date.now() - started });
    return fallback();
  }

  private record(t: StepTrace): void {
    const steps = [...this.trace().steps, t];
    this.trace.set({ steps, degradedCount: steps.filter((s) => s.degraded !== null).length });
  }

  // ─── Trasporto ───────────────────────────────────────────────────────────

  /**
   * `system` è un array con cache_control sul blocco stabile: il prompt è
   * identico a ogni chiamata, quindi il prefisso viene riusato invece di
   * essere ripagato (agents/workflow.md § Efficienza dei token).
   */
  private async callClaude(args: {
    model: string;
    system: string;
    user: string;
    maxTokens: number;
    effort?: 'low' | 'medium' | 'high';
    adaptiveThinking?: boolean;
  }): Promise<string> {
    const body: Record<string, unknown> = {
      model: args.model,
      max_tokens: args.maxTokens,
      system: [{ type: 'text', text: args.system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: args.user }],
    };
    if (args.effort) body['output_config'] = { effort: args.effort };
    // Adaptive thinking solo sui modelli che lo supportano: Haiku 4.5 non è
    // della famiglia 4.6+ e rifiuterebbe il parametro.
    if (args.adaptiveThinking) body['thinking'] = { type: 'adaptive' };

    return this.withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(CLAUDE_API, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.runMode.apiKey(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          // I 4xx non si ritentano: una chiave mancante o una richiesta
          // malformata non migliora al secondo tentativo.
          throw new HttpError(res.status);
        }
        const data = await res.json();
        const block = data.content?.find((b: { type: string }) => b.type === 'text');
        return block?.text ?? '';
      } finally {
        clearTimeout(timer);
      }
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (e) {
        lastError = e;
        const retryable = !(e instanceof HttpError) || e.status >= 500 || e.status === 429;
        if (!retryable || attempt === MAX_NETWORK_RETRIES) break;
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
    throw new StepFailure(lastError instanceof DOMException ? 'timeout' : 'network');
  }

  /** Estrae il JSON e lo valida contro lo schema. Il parsing non basta: senza
   *  validazione un oggetto con campi mancanti passa e rompe a valle. */
  private parse<T>(text: string, schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }): T {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new StepFailure('invalid-output');
    let raw: unknown;
    try {
      raw = JSON.parse(match[0]);
    } catch {
      throw new StepFailure('invalid-output');
    }
    const result = schema.safeParse(raw);
    if (!result.success || result.data === undefined) throw new StepFailure('invalid-output');
    return result.data;
  }

  private guard(texts: string[], allowed?: ReadonlySet<number>): void {
    for (const t of texts) {
      if (!runGuardrail(t, allowed).ok) throw new StepFailure('policy');
    }
  }

  // ─── Gli step ────────────────────────────────────────────────────────────
  // Istruzioni complete: ../../../agents/prompts/

  private async step1(state: AgentState): Promise<NonNullable<AgentState['step1']>> {
    const system = buildSystemPrompt(
      [NO_ADVICE, NO_MORALIZING],
      `Individua dove la persona si blocca, a partire dalle sue risposte.
Risali al punto più a monte, non all'ultimo sintomo.
Rispondi SOLO con JSON: {"painPoint":"<1 frase>","summary":"<2 frasi>"}
Massimo 50 parole totali.`,
    );
    const out = this.parse(
      await this.callClaude({
        model: MODEL_STEP1,
        system,
        user: JSON.stringify({ answers: state.answers }),
        maxTokens: 512,
        adaptiveThinking: true,
      }),
      Step1Schema,
    );
    this.guard([out.painPoint, out.summary]);
    return out;
  }

  private async step2(state: AgentState): Promise<NonNullable<AgentState['step2']>> {
    const system = buildSystemPrompt(
      [NO_ADVICE, NO_MORALIZING],
      `Assegna un punteggio 0-20 e l'archetipo corrispondente.
Punteggi: familiarità discreta o buona +5, conto attivo +3, riesce a mettere da parte +4,
conosce TAEG/tasso/inflazione +5 (vagamente +2).
Soglie: 0-8 novice, 9-14 aware, 15-20 practitioner.
Rispondi SOLO con JSON: {"archetype":"novice"|"aware"|"practitioner","score":<0-20>,"rationale":"<1 frase>"}
Il rationale descrive cosa la persona conosce, mai quanto vale. Massimo 30 parole.`,
    );
    const out = this.parse(
      await this.callClaude({
        model: MODEL_STEP23,
        system,
        user: JSON.stringify({ answers: state.answers, painPoint: state.step1?.painPoint }),
        maxTokens: 256,
        effort: 'low',
      }),
      Step2Schema,
    );
    // Il rationale non passa dal guardrail sull'etichetta: la contiene per natura.
    this.guard([out.rationale.replace(/\b(novice|aware|practitioner)\b/gi, '')]);
    return out;
  }

  private async step3(state: AgentState): Promise<NonNullable<AgentState['step3']>> {
    const archetype = state.step2?.archetype ?? 'novice';
    const system = buildSystemPrompt(
      [NO_ADVICE, NO_MORALIZING, NUMERIC_GROUNDING],
      `Genera 3 micro-lezioni per l'archetipo e il pain point ricevuti.
novice: concetti elementari, frasi cortissime, nessun termine tecnico.
aware: parti dai documenti reali (busta paga, bolletta, estratto conto).
practitioner: conseguenze e simulazioni, senza analogie.
Rispondi SOLO con JSON: {"lessons":[{"title":"","body":"","emoji":""}],"nextStep":""}
Esattamente 3 lezioni, body massimo 40 parole. Massimo 150 parole totali.
nextStep è una possibilità ("puoi..."), mai un'istruzione.`,
    );
    const out = this.parse(
      await this.callClaude({
        model: MODEL_STEP23,
        system,
        user: JSON.stringify({
          archetype,
          painPoint: state.step1?.painPoint,
          verifiedFacts: factsBlock(archetype),
        }),
        maxTokens: 1024,
      }),
      Step3Schema,
    );
    this.guard(
      [...out.lessons.map((l) => `${l.title} ${l.body}`), out.nextStep],
      allowedValues(archetype),
    );
    return out;
  }

  // ─── Percorsi deterministici ─────────────────────────────────────────────
  // Usati sia in modalità locale sia come fallback in modalità live.

  private fallbackStep1(state: AgentState): NonNullable<AgentState['step1']> {
    const declared = state.answers[4]?.answer ?? 'la gestione delle spese quotidiane';
    return {
      painPoint: `Difficoltà dichiarata: ${declared}.`,
      summary:
        'Profilo ricavato dalle risposte al questionario, senza analisi del modello. Alcune aree non sono state approfondite.',
    };
  }

  /**
   * Stessa scala del prompt dello step 2, non una logica parallela: è ciò che
   * rende il fallback confrontabile con l'LLM invece che solo sostitutivo.
   */
  private fallbackStep2(state: AgentState): NonNullable<AgentState['step2']> {
    const a = state.answers;
    let score = 0;
    if (a[1]?.answer === 'discreta' || a[1]?.answer === 'buona') score += 5;
    if (a[2]?.answer === 'si') score += 3;
    if (a[3]?.answer === 'si poco' || a[3]?.answer === 'si piano') score += 4;
    if (a[5]?.answer === 'si') score += 5;
    else if (a[5]?.answer === 'vagamente') score += 2;

    const archetype = archetypeFromScore(score);
    const rationale: Record<Archetype, string> = {
      novice: 'Non ha ancora incontrato i termini di base né strumenti per seguire entrate e uscite.',
      aware: 'Usa il conto e si orienta; i termini dei documenti che riceve non le sono ancora stati spiegati.',
      practitioner: 'Tiene già traccia di entrate e uscite e conosce i termini correnti.',
    };
    return { archetype, score, rationale: rationale[archetype] };
  }

  private fallbackStep3(state: AgentState): NonNullable<AgentState['step3']> {
    const archetype = state.step2?.archetype ?? 'novice';
    return { lessons: FALLBACK_LESSONS[archetype], nextStep: FALLBACK_NEXT_STEP[archetype] };
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

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

/**
 * Lezioni deterministiche, verificate a mano contro tutte e tre le politiche.
 * Nessuna contiene cifre non presenti in verified-facts.ts.
 */
const FALLBACK_LESSONS: Record<Archetype, Lesson[]> = {
  novice: [
    { title: 'Lordo e netto', body: 'Il lordo è quanto costa il tuo lavoro all\'azienda. Il netto è quello che arriva sul conto. La differenza non è mai stata tua: sono contributi e imposte trattenuti alla fonte.', emoji: '💶' },
    { title: 'Il conto corrente', body: 'Serve a ricevere lo stipendio e pagare. I soldi depositati sono coperti da una garanzia fino a 100.000 € per banca.', emoji: '🏦' },
    { title: 'Vedere dove vanno i soldi', body: 'Segnare le spese per una settimana non serve a cambiarle. Serve a sapere quali sono: quasi sempre sono diverse da come le ricordiamo.', emoji: '📝' },
  ],
  aware: [
    { title: 'INPS in busta paga', body: 'È la quota che finanzia la tua pensione futura. Viene trattenuta ogni mese e versata a tuo nome: non è una tassa che si perde, è un accantonamento.', emoji: '🏛️' },
    { title: 'Il TFR', body: 'Il datore accantona ogni mese una quota che ti versa quando lasci il lavoro. Compare in busta paga anche se non la ricevi adesso.', emoji: '🔒' },
    { title: 'Spese fisse e variabili', body: 'Le fisse tornano ogni mese uguali: affitto, abbonamenti, rate. Le variabili cambiano. Distinguerle è il primo passo per leggere un estratto conto.', emoji: '📊' },
  ],
  practitioner: [
    { title: 'Il saldo non è disponibilità', body: 'Sul conto ci sono anche soldi già promessi a rate e bollette in arrivo. La cifra che vedi è più alta di quella che puoi usare.', emoji: '🧮' },
    { title: 'Accantonare per le spese note', body: 'Una spesa prevista fra sei mesi si può dividere per sei. Quella quota, ogni mese, non fa più parte di quello che hai a disposizione.', emoji: '🗓️' },
    { title: 'Inflazione e potere d\'acquisto', body: 'Se i prezzi salgono e le somme ferme restano uguali, con la stessa cifra si compra meno. È il motivo per cui il valore di un importo cambia nel tempo.', emoji: '📈' },
  ],
};

const FALLBACK_NEXT_STEP: Record<Archetype, string> = {
  novice: 'Puoi cercare le voci "lordo" e "netto" sull\'ultima busta paga che hai ricevuto.',
  aware: 'Puoi riprendere l\'ultima busta paga e cercare le voci appena descritte.',
  practitioner: 'Puoi elencare le spese fisse del mese e sottrarle dal saldo attuale.',
};
