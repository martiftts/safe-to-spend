# Policy · Nessun giudizio sulla persona

**Possiede:** il divieto di valutare l'utente invece di descrivere ciò che sa.
**Si applica a:** lo step 2 (archetipo, `rationale`), lo step 3 (lezioni) e qualunque testo
derivato dall'archetipo.
**Delega a:** [no-advice.md](no-advice.md) per il divieto di consigliare — regola distinta.

---

## La regola

> Si descrive **cosa una persona già sa e cosa non le è ancora stato spiegato**.
> Non si valuta quanto è preparata.

La differenza non è sottile. «Bassa familiarità con la finanza» è un giudizio sulla persona.
«Non ha ancora incontrato i termini di una busta paga» descrive una situazione, e implica che il
problema sia rimediabile — cosa che il prodotto esiste per fare.

## Perché è una policy separata dal divieto di consulenza

È più insidiosa: il tono paternalistico si insinua in frasi che non contengono alcun consiglio e
che sembrano neutre. Un'app di educazione finanziaria parla a chi non ha avuto accesso a quella
educazione, spesso per ragioni che non dipendono da lei. Il moralismo verso quell'utenza è il modo
più rapido per farla chiudere e non riaprirla.

## Il caso dell'archetipo

I tre archetipi (`novice`, `aware`, `practitioner`) sono **etichette interne di sistema**.

- **Non vengono mai mostrate all'utente**, né tradotte e mostrate. Servono a scegliere il registro
  delle lezioni, non a comunicare un verdetto.
- Sono in inglese proprio per questo: se compaiono in interfaccia, è un bug visibile.
- Il campo `score` (0-20) non viene mai mostrato. Un punteggio su una persona è la forma più diretta
  del giudizio che questa policy vieta.

Il `rationale` dello step 2 è destinato al log e alla demo, non all'utente. Va comunque scritto
secondo questa policy: descrive lo stato delle conoscenze, non la persona.

## Vietato / Ammesso

| ❌ Mai | ✅ Sempre |
|---|---|
| «Bassa familiarità con la finanza» | «Non ha ancora incontrato i termini della busta paga» |
| «Non gestisce attivamente le sue finanze» | «Usa il conto ma non ha strumenti per seguirne i movimenti» |
| «Sei a un livello base» | *(l'archetipo non si mostra)* |
| «Bravo, sei più preparato della media» | *(anche la lode è giudizio — vedi sotto)* |
| «Purtroppo non riesci a risparmiare» | «Mettere da parte non rientra oggi tra le cose possibili» |

**Anche la lode è giudizio.** Un sistema che si complimenta quando rispondi bene è lo stesso che ti
sminuisce quando rispondi male: ha solo cambiato segno. La neutralità vale in entrambe le direzioni.

## Il caso delle difficoltà economiche

Se dalle risposte emerge che la persona non riesce a mettere da parte nulla, la lezione non
commenta il fatto e non propone di rimediarvi. Spiega il concetto richiesto e si ferma lì.
Non tutti i problemi di denaro sono problemi di educazione finanziaria, e trattarli come tali
è la forma di paternalismo più comune del settore.

## Verifica

Casi che devono essere bloccati:

1. Un `rationale` contenente «bassa», «scarsa», «insufficiente» riferito alla persona → bloccato
2. Una lezione che si apre con «Bravo» o «Purtroppo» → bloccato
3. L'archetipo o lo `score` presenti in un testo destinato all'interfaccia → bloccato
4. «Non ha ancora incontrato i termini della busta paga» → **ammesso**
