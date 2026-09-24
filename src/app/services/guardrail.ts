/**
 * Filtro deterministico applicato a ogni testo mostrato all'utente.
 *
 * Deterministico e non un secondo passaggio LLM, per tre motivi: costa zero
 * token, è più veloce di una chiamata di rete, ed è dimostrabile dal vivo
 * mentre blocca — cosa che il giudizio di un modello non è.
 *
 * Regole e razionale: ../../../agents/policies/
 */

export type Surface = 'educational' | 'solver';

export interface GuardrailOptions {
  surface?: Surface;
  allowed?: ReadonlySet<number>;
  allowedCategories?: ReadonlySet<string>;
  adviceRequestedAt?: Date | null;
}

export interface Violation {
  policy: 'no-advice' | 'no-moralizing' | 'numeric-grounding';
  detail: string;
}

export interface GuardrailResult {
  ok: boolean;
  violations: Violation[];
}

/**
 * `\b` in JavaScript è basato su ASCII: non riconosce i confini di parola con
 * le lettere accentate. `/\bè troppo\b/` non trova «è troppo basso» e
 * `/familiarità\b/` non trova «familiarità con». Su un filtro che protegge
 * testi italiani è un difetto sostanziale — le regole non scattano mai.
 *
 * Questi confini sono unicode-aware e funzionano con le accentate.
 */
const START = '(?<![\\p{L}\\p{N}])';
const END = '(?![\\p{L}\\p{N}])';
const w = (body: string): RegExp => new RegExp(START + body + END, 'iu');

/** agents/policies/no-advice.md § Forme vietate */
const ADVICE_PATTERNS: Array<[RegExp, string]> = [
  [w('dovres(ti|te)'), 'imperativo'],
  [w('devi'), 'imperativo'],
  [w('evita(re|lo|li)?'), 'imperativo'],
  [w('ti (consigli|suggeri)\\w*'), 'consiglio esplicito'],
  [w('(ti )?convien[ea]'), 'giudizio di convenienza'],
  [w('è meglio'), 'giudizio di convenienza'],
  [w('è tropp[oa]'), 'valutazione di soglia'],
  [w('è poc[oa]'), 'valutazione di soglia'],
  [w('attenzione'), 'allarme'],
  [w('rischi di'), 'allarme'],
  [w('(apri|sottoscrivi|scegli|imposta) un\\w* (conto|prodotto|fondo|prestito|accantonamento)'), 'indicazione di prodotto o azione'],
];

/** agents/policies/no-moralizing.md § Vietato / Ammesso */
const MORALIZING_PATTERNS: Array<[RegExp, string]> = [
  [w('brav[oa]'), 'lode'],
  [w('ottim[oa]'), 'lode'],
  [w('complimenti'), 'lode'],
  [w('purtroppo'), 'commiserazione'],
  [w('(scars[ao]|insufficiente|inadeguat[oa])'), 'giudizio sulla persona'],
  [w('bassa (familiarità|conoscenza|preparazione)'), 'giudizio sulla persona'],
  [w('(novice|aware|practitioner)'), 'etichetta interna esposta'],
  // Vocabolario valutativo sulle spese: vedi no-moralizing.md
  // § Categorizzazione delle spese. Le etichette ammesse sono descrittive.
  [w('voluttuari[eoa]'), 'etichetta valutativa'],
  [w('superflu[eoa]'), 'etichetta valutativa'],
  [w('non essenzial[ei]'), 'etichetta valutativa'],
  [w('impulsiv[eoi]'), 'giudizio sulla spesa'],
  [w('senso di colpa'), 'giudizio sulla spesa'],
  [w('con giudizio'), 'giudizio sulla spesa'],
  [w('spese non consapevoli'), 'giudizio sulla spesa'],
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

const CATEGORIE_NEUTRE = ['casa', 'trasporti', 'alimentari', 'salute', 'abbonamenti', 'tempo libero', 'tempo_libero', 'altro'];

/**
 * Solo in surface:solver. Verifica che il testo non nomini categorie
 * che l'utente non ha dichiarato come leve comprimibili.
 */
export function checkCategoryLeakage(text: string, allowedCategories: ReadonlySet<string>): Violation[] {
  return CATEGORIE_NEUTRE
    .filter(cat => {
      const canonicale = cat.replace(' ', '_');
      return !allowedCategories.has(cat) && !allowedCategories.has(canonicale);
    })
    .filter(cat => w(cat.replace(' ', '[ _]')).test(text))
    .map(cat => ({
      policy: 'no-advice' as const,
      detail: `categoria non dichiarata nelle leve: ${cat}`,
    }));
}

/**
 * Esegue tutti i controlli.
 *
 * Firma legacy compatibile: `runGuardrail(text, allowed?)` dove allowed è
 * un ReadonlySet<number>. La firma estesa accetta GuardrailOptions.
 *
 * surface:'solver' richiede adviceRequestedAt valorizzato; senza,
 * viene aggiunta una violazione di policy.
 */
export function runGuardrail(
  text: string,
  optionsOrAllowed?: GuardrailOptions | ReadonlySet<number>,
): GuardrailResult {
  const options: GuardrailOptions =
    optionsOrAllowed instanceof Set
      ? ({ allowed: optionsOrAllowed } satisfies GuardrailOptions)
      : ((optionsOrAllowed ?? {}) as GuardrailOptions);

  const { surface = 'educational', allowed, allowedCategories, adviceRequestedAt } = options;

  const violations: Violation[] = [
    // In solver mode, il no-advice classico non si applica: l'output è
    // puramente calcolato entro le leve dichiarate dall'utente.
    ...(surface === 'educational' ? checkNoAdvice(text) : []),
    ...checkNoMoralizing(text),
    ...(allowed ? checkGrounding(text, allowed) : []),
    // Solver: richiede richiesta esplicita registrata (adviceRequestedAt).
    ...(surface === 'solver' && !adviceRequestedAt
      ? [{ policy: 'no-advice' as const, detail: 'surface:solver richiede adviceRequestedAt valorizzato' }]
      : []),
    // Solver: non può nominare categorie non nelle leve dichiarate.
    ...(surface === 'solver' && allowedCategories
      ? checkCategoryLeakage(text, allowedCategories)
      : []),
  ];

  return { ok: violations.length === 0, violations };
}
