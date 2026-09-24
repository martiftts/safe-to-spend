# Policy · Fallback, limiti di iterazione, escalation

**Possiede:** tutti i limiti di iterazione del sistema e le regole di degradazione.
**Si applica a:** i tre step e ogni ciclo del workflow.

---

## Principio

> Nessun ciclo è illimitato, e nessuna degradazione è nascosta all'utente.

Un sistema agentico che ritenta indefinitamente brucia token e tempo. Uno che degrada in silenzio è
peggio: mostra un contenuto generico facendolo passare per personalizzato, e l'utente non ha modo
di saperlo.

## Tabella dei limiti

| Ciclo | Limite | Al superamento |
|---|---|---|
| Timeout singola chiamata | 15 s (`AbortController`) | Fallback deterministico dello step |
| Retry su errore di rete o 5xx | 2, backoff esponenziale | Fallback deterministico dello step |
| Rigenerazione dopo violazione di policy | 1 | Fallback deterministico dello step |
| Output non conforme allo schema | 1 rigenerazione | Fallback deterministico dello step |
| Step degradati tollerati | 2 su 3 | Il profilo si completa, **con avviso esplicito** |
| Step degradati = 3 su 3 | — | Si mostra l'errore e si offre di riprovare |

Gli errori 4xx **non si ritentano**: una chiave mancante o una richiesta malformata non migliora
al secondo tentativo. Si va direttamente al fallback.

## I tre fallback deterministici

Implementati in `../../src/app/services/claude.service.ts`. Non sono ripieghi poveri: sono percorsi
scritti a mano che producono un risultato corretto, solo meno personalizzato.

| Step | Fallback |
|---|---|
| 1 · Analyze | Il pain point viene preso dalla risposta esplicita alla domanda «cosa ti mette più in difficoltà» |
| 2 · Classify | Classificazione locale a punteggio: somma pesata delle risposte, soglie 0-8 / 9-14 / 15-20 |
| 3 · Educate | Tre lezioni prescritte per archetipo, già verificate rispetto a [numeric-grounding.md](numeric-grounding.md) |

Il fallback dello step 2 merita una nota: **il punteggio locale è la stessa scala che il modello
deve usare.** Non è un percorso alternativo ma la stessa logica resa esplicita, il che rende il
fallback verificabile contro l'LLM invece che solo sostitutivo.

## I due punti di escalation verso l'utente

### 1 · Degradazione parziale

Con uno o due step in fallback, il profilo si mostra comunque, preceduto da una riga onesta:

> *«Una parte di questi contenuti è generica: non siamo riusciti a personalizzarla.»*

Non è una scusa e non è un errore tecnico esposto all'utente. È l'informazione che gli serve per
sapere quanto fidarsi di ciò che legge.

### 2 · Degradazione totale

Con tutti e tre gli step falliti non si finge un risultato. Si mostra cosa non ha funzionato e si
offre di riprovare, conservando le risposte già date — **il questionario non si ricompila mai da
capo.**

## Cosa non è escalation

Non si interrompe l'utente per:

- una lezione su tre che non passa il grounding (si sostituisce con quella di fallback, le altre due
  restano quelle generate)
- una latenza alta (si mostra lo stato di avanzamento, non un errore)
- un archetipo `novice` — è un esito legittimo, non un problema

La distinzione: si escala quando **il sistema non è riuscito**, non quando **il risultato non è
lusinghiero**.

## Verifica

1. Timeout simulato sullo step 1 → il workflow prosegue con il fallback, non si interrompe
2. Errore 401 → nessun retry, fallback immediato
3. Errore 503 → 2 retry con backoff, poi fallback
4. Due step degradati → il profilo si mostra con l'avviso
5. Tre step degradati → schermata di errore con risposte conservate e pulsante di ripetizione
6. Output non conforme allo schema Zod → una rigenerazione, poi fallback
