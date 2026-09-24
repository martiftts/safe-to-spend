/**
 * Filtro deterministico applicato a ogni testo mostrato all'utente.
 *
 * Deterministico e non un secondo passaggio LLM, per tre motivi: costa zero
 * token, è più veloce di una chiamata di rete, ed è dimostrabile dal vivo
 * mentre blocca — cosa che il giudizio di un modello non è.
 *
 * Regole e razionale: ../../../agents/policies/
 */

export interface Violation {
  policy: 'no-advice' | 'no-moralizing' | 'numeric-grounding';
  detail: string;
}

export interface GuardrailResult {
  ok: boolean;
  violations: Violation[];
}

/** agents/policies/no-advice.md § Forme vietate */
const ADVICE_PATTERNS: Array<[RegExp, string]> = [
  [/\bdovres(ti|te)\b/i, 'imperativo'],
  [/\bdevi\b/i, 'imperativo'],
  [/\bti consigli/i, 'consiglio esplicito'],
  [/\bti suggeri/i, 'consiglio esplicito'],
  [/\b(ti )?convien[ea]\b/i, 'giudizio di convenienza'],
  [/\bè meglio\b/i, 'giudizio di convenienza'],
  [/\bè tropp[oa]\b/i, 'valutazione di soglia'],
  [/\bè poc[oa]\b/i, 'valutazione di soglia'],
  [/\battenzione\b/i, 'allarme'],
  [/\brischi di\b/i, 'allarme'],
  [/\b(apri|sottoscrivi|scegli) un (conto|prodotto|fondo|prestito)/i, 'indicazione di prodotto'],
];

/** agents/policies/no-moralizing.md § Vietato / Ammesso */
const MORALIZING_PATTERNS: Array<[RegExp, string]> = [
  [/\bbrav[oa]\b/i, 'lode'],
  [/\bottim[oa]\b/i, 'lode'],
  [/\bcomplimenti\b/i, 'lode'],
  [/\bpurtroppo\b/i, 'commiserazione'],
  [/\b(scars[ao]|insufficiente|inadeguat[oa])\b/i, 'giudizio sulla persona'],
  [/\bbassa (familiarità|conoscenza|preparazione)\b/i, 'giudizio sulla persona'],
  [/\b(novice|aware|practitioner)\b/i, 'etichetta interna esposta'],
];

export function checkNoAdvice(text: string): Violation[] {
  return ADVICE_PATTERNS.filter(([re]) => re.test(text)).map(([re, detail]) => ({
    policy: 'no-advice' as const,
    detail: `${detail}: ${text.match(re)?.[0] ?? ''}`,
  }));
}

export function checkNoMoralizing(text: string): Violation[] {
  return MORALIZING_PATTERNS.filter(([re]) => re.test(text)).map(([re, detail]) => ({
    policy: 'no-moralizing' as const,
    detail: `${detail}: ${text.match(re)?.[0] ?? ''}`,
  }));
}

/**
 * Estrae i token numerici da un testo in formato italiano.
 * `1.234,56` → 1234.56 · `100.000 €` → 100000 · `6,91%` → 6.91
 */
export function extractNumbers(text: string): number[] {
  const tokens = text.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g) ?? [];
  return tokens
    .map((t) => Number(t.replace(/\./g, '').replace(',', '.')))
    .filter((n) => Number.isFinite(n));
}

/**
 * Ordinali e quantità di struttura, sempre ammessi: non sono affermazioni
 * sul mondo ma sul testo stesso ("i 3 passi", "in 2 settimane").
 */
const STRUCTURAL = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

/** agents/policies/numeric-grounding.md */
export function checkGrounding(text: string, allowed: ReadonlySet<number>): Violation[] {
  return extractNumbers(text)
    .filter((n) => !allowed.has(n) && !STRUCTURAL.has(n))
    .map((n) => ({
      policy: 'numeric-grounding' as const,
      detail: `cifra non verificata: ${n}`,
    }));
}

/**
 * Esegue tutti i controlli. `allowed` va passato solo per i testi che possono
 * contenere cifre (step 3); omesso, il controllo numerico non viene eseguito.
 */
export function runGuardrail(text: string, allowed?: ReadonlySet<number>): GuardrailResult {
  const violations = [
    ...checkNoAdvice(text),
    ...checkNoMoralizing(text),
    ...(allowed ? checkGrounding(text, allowed) : []),
  ];
  return { ok: violations.length === 0, violations };
}
