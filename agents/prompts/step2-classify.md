# Step 2 · Classify

**Modello:** `claude-haiku-4-5` · `output_config: { effort: "low" }`
**Output strutturato:** `Step2Schema` in `../schemas/steps.ts`
**Implementazione:** `../../src/app/services/claude.service.ts` → `step2()`

---

## Scope

Assegna la persona a uno dei tre archetipi e ne motiva l'assegnazione.

**Fa:** attribuisce un punteggio 0-20 e l'archetipo corrispondente.
**Non fa:** identificare il pain point (step 1), produrre contenuti (step 3).

## Perché un modello piccolo

I criteri sono già espliciti nel prompt, la scala è fissata, le classi sono tre. Non c'è inferenza
aperta: è un'attribuzione a soglie. Un modello più capace non produrrebbe una classificazione
migliore, solo più costosa.

## Input

- Le sei risposte al questionario
- Il `painPoint` dello step 1

## Output

`Step2Schema`: `archetype`, `score` (0-20), `rationale`.

---

## Gli archetipi

| Archetipo | Punteggio | Descrizione |
|---|---|---|
| `novice` | 0-8 | Non ha ancora incontrato i termini di base né strumenti di gestione |
| `aware` | 9-14 | Ha un conto e si orienta, ma non segue attivamente entrate e uscite |
| `practitioner` | 15-20 | Tiene già traccia di entrate e uscite, conosce i termini correnti |

**Le etichette sono interne al sistema e non vengono mai mostrate all'utente**, né tradotte. Lo
stesso vale per `score`. Il motivo è in `../policies/no-moralizing.md` § Il caso dell'archetipo.

## Scala del punteggio

La stessa usata dal fallback deterministico (`archetypeFromScore` in `../schemas/steps.ts`).
Non è una logica parallela: è la scala resa esplicita, così che l'esito del modello e quello del
fallback siano confrontabili.

| Segnale | Punti |
|---|---|
| Familiarità dichiarata «discreta» o «buona» | +5 |
| Conto corrente attivo | +3 |
| Riesce a mettere da parte, anche poco | +4 |
| Conosce TAEG / tasso / inflazione | +5 |
| Ne ha sentito parlare vagamente | +2 |

## Vincoli

Si applicano, senza essere qui riscritti:

- `../policies/no-advice.md`
- `../policies/no-moralizing.md` — vale **soprattutto per il `rationale`**, che è il punto del
  sistema in cui il giudizio sulla persona rientra più facilmente

Vincolo specifico: `rationale` **massimo 30 parole**, e deve descrivere cosa la persona conosce,
non quanto vale.

## Esempio

**Input:** risposte + `painPoint: "Non riconosce le voci della busta paga…"`

**Output:**

```json
{
  "archetype": "aware",
  "score": 12,
  "rationale": "Usa il conto corrente e mette da parte saltuariamente; i termini fiscali della busta paga non le sono ancora stati spiegati."
}
```

**Cosa sarebbe stato rifiutato:** `"Conoscenze finanziarie insufficienti, gestione approssimativa"` —
giudica la persona invece di descrivere cosa conosce.
