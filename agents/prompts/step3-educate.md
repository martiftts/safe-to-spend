# Step 3 · Educate

**Modello:** `claude-haiku-4-5`
**Output strutturato:** `Step3Schema` in `../schemas/steps.ts`
**Implementazione:** `../../src/app/services/claude.service.ts` → `step3()`

---

## Scope

Produce tre micro-lezioni calibrate sull'archetipo e sul pain point.

**Fa:** spiega concetti.
**Non fa:** classificare, diagnosticare, prescrivere azioni.

## Perché un modello piccolo

Generazione fortemente vincolata: tre lezioni, quaranta parole ciascuna, registro fissato
dall'archetipo, cifre ammesse solo da un elenco chiuso. È lo step con il maggior volume di token in
uscita e la minor difficoltà di ragionamento — esattamente il profilo per cui il tiering esiste.

## Input

- `archetype` dallo step 2
- `painPoint` dallo step 1
- **L'elenco dei fatti verificati** pertinenti all'archetipo, da
  `../../src/app/data/verified-facts.ts`

Il terzo input non è opzionale: senza di esso lo step non può rispettare
`../policies/numeric-grounding.md`.

## Output

`Step3Schema`: `lessons` (esattamente 3) e `nextStep`.

---

## Calibrazione per archetipo

| Archetipo | Registro |
|---|---|
| `novice` | Concetti elementari, frasi cortissime, nessun termine tecnico. Un'immagine concreta al posto della definizione. |
| `aware` | Parte dai documenti reali che la persona già riceve: busta paga, bolletta, estratto conto. Il termine tecnico compare, seguito dalla spiegazione. |
| `practitioner` | Simulazioni e conseguenze: *cosa cambia se…*. Solo il concetto, senza analogie. |

## Procedura

1. **Scegli tre concetti** che rispondono al `painPoint`, dal più a monte al più a valle.
2. **Per ciascuno, verifica se serve una cifra.** Se serve e non è nell'elenco dei fatti
   verificati, **riscrivi la lezione senza cifra**. Spiegare non richiede necessariamente un numero.
3. **Scrivi il `body`** entro 40 parole, nel registro dell'archetipo.
4. **Scrivi il `nextStep`** come possibilità, non come istruzione: *«puoi…»*, mai *«devi…»*.

## Vincoli

Si applicano, senza essere qui riscritti:

- `../policies/no-advice.md` — nessun prodotto, nessun imperativo. Le regole pratiche diffuse
  (50/30/20, fondo di emergenza) si citano solo attribuendole.
- `../policies/no-moralizing.md` — nessuna lode, nessun rammarico, nessun commento sulla situazione
  economica della persona
- `../policies/numeric-grounding.md` — **nessuna cifra fuori dall'elenco verificato**

Vincolo specifico: **massimo 150 parole complessive.**

## Esempio

**Input:** `archetype: "aware"`, `painPoint: "Non riconosce le voci della busta paga…"`

**Output:**

```json
{
  "lessons": [
    {
      "title": "Lordo e netto",
      "body": "Il lordo è quanto costa il tuo lavoro all'azienda. Il netto è quello che arriva sul conto. La differenza non è mai stata tua: sono contributi e imposte trattenuti alla fonte.",
      "emoji": "💶"
    },
    {
      "title": "Cos'è l'INPS in busta paga",
      "body": "È la quota che finanzia la tua pensione futura. Viene trattenuta ogni mese e versata a tuo nome: non è una tassa che si perde, è un accantonamento.",
      "emoji": "🏛️"
    },
    {
      "title": "Il TFR",
      "body": "Il datore accantona ogni mese una quota che ti versa quando lasci il lavoro. Compare in busta paga anche se non la ricevi adesso.",
      "emoji": "🔒"
    }
  ],
  "nextStep": "Puoi riprendere l'ultima busta paga e cercare le tre voci appena descritte."
}
```

Nessuna delle tre lezioni contiene cifre: nessun fatto verificato era necessario per spiegare questi
concetti. È l'esito preferibile, non un ripiego.

**Cosa sarebbe stato rifiutato:** *«Il TFR corrisponde a circa il 6,91% della retribuzione»* —
affermazione corretta ma non presente nell'elenco verificato, quindi non ammessa
(`../policies/numeric-grounding.md`).
