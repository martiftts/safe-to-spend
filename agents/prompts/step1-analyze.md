# Step 1 · Analyze

**Modello:** `claude-opus-5`
**Output strutturato:** `Step1Schema` in `../schemas/steps.ts`
**Implementazione:** `../../src/app/services/claude.service.ts` → `step1()`

---

## Scope

Dalle sei risposte al questionario, individua **dove** la persona si blocca.

**Fa:** identifica il punto di attrito dominante e ne scrive un profilo sintetico.
**Non fa:** classificare (step 2), spiegare o insegnare (step 3), proporre soluzioni.

## Perché il modello più capace

È l'unico step che richiede un giudizio qualitativo: sei risposte eterogenee, e va colto quale
difficoltà le lega. Ed è l'unico il cui output condiziona entrambi gli step successivi — un pain
point sbagliato produce una classificazione sbagliata e tre lezioni fuori bersaglio, tutte
plausibili. Il razionale completo del tiering è in `../README.md`.

## Input

Le sei risposte, come array `{ question, answer }`:

1. Quanti anni hai?
2. Familiarità con la finanza?
3. Hai un conto corrente attivo?
4. Riesci a mettere qualcosa da parte?
5. Cosa ti mette più in difficoltà?
6. Hai sentito parlare di TAEG / tasso / inflazione?

## Output

`Step1Schema`: `painPoint` (una frase) e `summary` (due frasi).
Nessun testo fuori dalla struttura.

---

## Procedura

1. **Leggi la risposta 5** — è la difficoltà dichiarata. È il punto di partenza, non la conclusione.
2. **Confrontala con le risposte 2, 3, 4 e 6** per capire se la difficoltà dichiarata è quella reale
   o il sintomo di una precedente. *«Non riesco a risparmiare»* unito a *«non so cosa sia
   l'inflazione»* e *«non tengo traccia delle spese»* indica che il blocco sta prima del risparmio:
   sta nel non vedere dove vanno i soldi.
3. **Formula il `painPoint`** come il punto più a monte della catena, non l'ultimo sintomo.
   È quello che rende utili le lezioni dello step 3.
4. **Scrivi il `summary`** descrivendo cosa la persona già conosce e cosa non le è ancora stato
   spiegato.

## Vincoli

Si applicano, senza essere qui riscritti:

- `../policies/no-advice.md` — nessuna soluzione, nessuna indicazione su cosa fare
- `../policies/no-moralizing.md` — si descrive lo stato delle conoscenze, mai la persona

Vincolo specifico di questo step: **massimo 50 parole complessive**. Il `painPoint` viene inserito
nei prompt degli step 2 e 3: ogni parola in più qui si paga tre volte.

## Esempio

**Input** (risposte sintetizzate): 34 anni · familiarità «scarsa» · conto sì · mette da parte «no» ·
difficoltà «non capisco la busta paga» · TAEG «mai sentito»

**Output:**

```json
{
  "painPoint": "Non riconosce le voci della busta paga e non distingue il lordo dal netto disponibile.",
  "summary": "Usa un conto corrente ma non ha strumenti per leggere i documenti che riceve. I termini contrattuali e fiscali non le sono ancora stati spiegati."
}
```

Nota: il `summary` dice *«non le sono ancora stati spiegati»*, non *«non li conosce»*. La prima
formulazione descrive una situazione rimediabile, la seconda un difetto della persona —
`../policies/no-moralizing.md`.
