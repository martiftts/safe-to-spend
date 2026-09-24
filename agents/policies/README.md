# Policies

Regole trasversali del sistema. **Ogni regola è definita qui e solo qui.** I prompt degli step la
citano per nome (`policies/no-advice.md`) e non ne riscrivono il contenuto.

## Indice

| Policy | Possiede | Applicata a |
|---|---|---|
| [no-advice.md](no-advice.md) | Il confine tra spiegare e consigliare | Ogni testo mostrato all'utente |
| [no-moralizing.md](no-moralizing.md) | Il divieto di giudicare la persona | Step 2 e 3, e tutto ciò che deriva dall'archetipo |
| [numeric-grounding.md](numeric-grounding.md) | La verificabilità delle cifre nelle lezioni | Step 3 |
| [escalation.md](escalation.md) | Fallback, limiti di iterazione, HITL | Ogni step, ogni ciclo |

## Come vengono applicate

Le prime due sono verificate da un filtro **deterministico** (`../../src/app/services/guardrail.ts`),
non da un secondo passaggio LLM. Motivi: costa zero token, è più veloce, ed è dimostrabile dal vivo
mentre blocca — cosa che il giudizio di un modello non è.

La terza è verificata da un controllo sulle cifre presenti nelle lezioni generate.
La quarta è implementata nell'orchestratore (`../workflow.md`) e in
`../../src/app/services/claude.service.ts`.

Un output che viola una policy **non viene mostrato**: si rigenera una volta, e se fallisce ancora
si attiva il fallback deterministico dello step. Non esiste il caso «mostrato con un avviso».

## Verifica

Ogni policy dichiara una sezione *Verifica* con i casi che devono fallire. Sono implementati in
`../../src/app/services/guardrail.spec.ts` e girano con `npm test`.
