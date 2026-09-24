/**
 * Il testo operativo delle politiche, in forma iniettabile nei system prompt.
 *
 * Fonte unica anche a runtime: prima queste regole erano riscritte dentro i tre
 * prompt con tre formulazioni diverse. Qui esistono una volta e vengono composte.
 *
 * Specifica completa e razionale: ../../../agents/policies/
 * Le stringhe sono volutamente brevi: viaggiano in ogni chiamata e in ogni
 * rigenerazione, quindi ogni parola si paga tre volte per sessione.
 */

/** agents/policies/no-advice.md */
export const NO_ADVICE = `Descrivi e spiega. Non dire mai cosa fare, cosa scegliere o cosa conviene.
Vietati: dovresti, ti consiglio, ti conviene, è meglio, è troppo, è poco, attenzione.
Vietato nominare banche, prodotti, conti o investimenti.
Le regole pratiche diffuse (50/30/20, fondo di emergenza) si citano solo attribuendole a chi le usa.`;

/** agents/policies/no-moralizing.md */
export const NO_MORALIZING = `Descrivi cosa la persona già conosce e cosa non le è ancora stato spiegato.
Non valutarla mai: né in negativo (scarsa, insufficiente, purtroppo) né in positivo (bravo, ottimo).
Non commentare la sua situazione economica.`;

/** agents/policies/numeric-grounding.md */
export const NUMERIC_GROUNDING = `Puoi usare solo le cifre presenti nell'elenco dei fatti verificati che ricevi.
Se serve un numero che non è nell'elenco, riscrivi la frase senza numeri.
Una spiegazione senza cifre è preferibile a una cifra non verificata.`;

/** Preambolo comune a tutti gli step. */
export const ROLE = `Sei un assistente di educazione finanziaria di base, in italiano.`;

/**
 * Compone il system prompt di uno step.
 * Il preambolo e le politiche precedono sempre la parte variabile: è il prefisso
 * stabile su cui agisce cache_control, e deve restare identico byte per byte
 * tra una chiamata e l'altra.
 */
export function buildSystemPrompt(policies: string[], task: string): string {
  return [ROLE, ...policies, task].join('\n\n');
}
