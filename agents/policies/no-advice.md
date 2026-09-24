# Policy · Nessuna consulenza finanziaria

**Possiede:** il confine tra spiegare e consigliare.
**Si applica a:** ogni testo mostrato all'utente, prodotto da qualunque step.
**Delega a:** [no-moralizing.md](no-moralizing.md) per il giudizio sulla persona —
regola distinta, file distinto.

---

## La regola

> L'applicazione descrive **ciò che è** e spiega **cosa significa**.
> Non indica mai cosa fare, cosa scegliere, cosa è preferibile.

Il tema della sfida vieta esplicitamente «raccomandazioni di investimento, consulenza finanziaria
personalizzata o indicazioni su cosa comprare, vendere o scegliere». Il vincolo non è cosmetico: un
sistema che raccoglie reddito, nucleo familiare e debiti e poi emette giudizi sta facendo
profilazione consulenziale, che è un'attività regolamentata.

## Forme vietate

| Categoria | Esempi di formulazione |
|---|---|
| Imperativo o suggerimento | *dovresti*, *ti consiglio*, *prova a*, *potresti* |
| Giudizio di convenienza | *ti conviene*, *è meglio*, *non vale la pena*, *è la scelta giusta* |
| Valutazione di una soglia | *è troppo*, *è poco*, *è alto*, *è basso*, *preoccupante* |
| Allarme | *attenzione*, *rischi di*, *stai per* |
| Indicazione di prodotto | qualunque menzione di banche, conti, prestiti o strumenti specifici |

## Forme ammesse

- «Questo è …» — constatazione
- «Questo significa …» — spiegazione
- «Questo succede se …» — simulazione richiesta dall'utente
- «Le banche usano questa soglia per …» — attribuzione esplicita a un terzo

## Il caso delle regole pratiche

Nella divulgazione finanziaria circolano regole pratiche diffuse: il *50/30/20*, i *tre mesi di
spese da parte*, il *fondo di emergenza*. Non sono fatti e non sono consigli professionali: sono
convenzioni.

Si possono citare **attribuendole a chi le usa**, mai formulandole all'imperativo:

> ✅ «Una regola diffusa tra i divulgatori divide il netto in 50% spese fisse, 30% variabili,
> 20% risparmio. Serve a dare un ordine di grandezza, non è una prescrizione.»
> ❌ «Dividi il tuo netto in 50/30/20.»
> ❌ «L'obiettivo standard è tre mesi di spese in liquidità.»

La differenza è che la prima lascia la valutazione all'utente e le altre due gliela tolgono.

Lo stesso vale per le soglie istituzionali (aliquote, scaglioni, garanzie): si spiegano come fatti
del sistema, mai come metro di giudizio sulla situazione di chi legge. Le cifre che le accompagnano
ricadono sotto [numeric-grounding.md](numeric-grounding.md).

## Nota sul nome del progetto

`safe-to-spend` riprende un concetto fintech esistente. *Safe* qui significa «senza rompere impegni
già presi» — un vincolo aritmetico, non una raccomandazione. La parola non compare mai
nell'interfaccia, che è interamente in italiano.

## Verifica

Casi che devono essere bloccati (`../../src/app/services/guardrail.spec.ts`):

1. «Dovresti mettere da parte qualcosa ogni mese» → bloccato (imperativo)
2. «Il tuo livello di risparmio è troppo basso» → bloccato (valutazione)
3. «Attenzione: rischi di non arrivare a fine mese» → bloccato (allarme)
4. «Apri un conto deposito» → bloccato (indicazione di prodotto)
5. «Una regola diffusa divide il netto in 50/30/20.» → **ammesso** (attribuita)
6. «L'INPS è una trattenuta obbligatoria: finanzia la tua pensione futura.» → **ammesso** (fatto)
