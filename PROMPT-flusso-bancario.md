# Prompt · nuovo flusso «dati bancari → obiettivo → simulazione»

Da incollare in una sessione di agentic coding sul repo.
Il testo operativo comincia dopo la riga orizzontale: copiare da lì in giù.

---

Lavori nel repo safe-to-spend (Angular 22 + Tailwind 3).

## Leggi prima di scrivere codice

1. `agents/README.md` — mappa del sistema agentico e regola di fattorizzazione
2. `agents/policies/` — tutte e cinque. **Sono vincolanti, non consigli.**
3. `agents/schemas/steps.ts` — i contratti di output esistenti
4. `src/app/services/claude.service.ts` — il workflow a 3 step già in piedi

Regola che governa tutto il repo: **ogni regola è scritta una volta sola, nel file
che la possiede.** Non riscrivere le policy dentro i prompt: citale.

## Cosa costruire

Un nuovo flusso, da affiancare al questionario esistente.

Premessa di prodotto: **l'app è quella della banca dell'utente**, quindi conosce
già i suoi dati finanziari. Non c'è nulla da caricare a mano.

### 1 · Consenso

Schermata che mostra quali dati l'app già possiede (conto principale) e chiede il
permesso di accedere agli altri conti che l'utente dichiara di avere.

- Un interruttore per fonte, non un consenso unico
- Ogni voce dice **cosa** verrà letto e **a cosa serve**
- Revocabile in qualsiasi momento
- Senza consenso il flusso prosegue comunque, con i soli dati del conto principale

### 2 · Caricamento automatico

Ottenuti i permessi, carica e normalizza:

- movimenti del conto (entrate e uscite)
- piani di mutuo: rata, scadenza, capitale residuo
- piani rateizzati e debiti futuri: rata, rate residue

### 3 · Categorizzazione

Suddividi le uscite per tipologia con **etichette descrittive e neutre**:
`casa · trasporti · alimentari · salute · abbonamenti · tempo libero · altro`

Vietate le etichette valutative (`superfluo`, `voluttuario`, `evitabile`,
`essenziale`): vedi `agents/policies/no-moralizing.md`. Da un movimento bancario
non si può sapere se una spesa era necessaria.

Rileva le **ricorrenze** (stesso importo, stessa cadenza): sono la parte del
bilancio che le persone dimenticano di avere.

### 4 · Spese future

Elaborati i dati, chiedi all'utente quali spese già previste conosce
(vacanza, auto, dentista, scuola). Per ciascuna: importo stimato e quando.

Calcola l'**accantonamento mensile**: `importo ÷ mesi mancanti`. È il concetto di
sinking fund, e va mostrato come tale — quei soldi sono già impegnati anche se
sono ancora sul conto.

### 5 · Obiettivi

Chiedi se vuole fissare un obiettivo di acquisto: cosa, quanto costa, entro quando.

### 6 · Simulazione — l'utente sceglie, l'app calcola

L'app **non propone** cosa tagliare di propria iniziativa.

- Mostra la spesa mensile per categoria, con l'importo
- L'utente marca **lui** quali categorie considera comprimibili, e di quanto
  (uno slider per categoria)
- L'app ricalcola in tempo reale: **«con queste riduzioni l'obiettivo arriva a
  <data> invece che a <data>»**
- Mostra anche lo scenario a zero riduzioni, come riferimento

La simulazione è uno strumento di calcolo che l'utente guida, non un consiglio
che l'app emette.

### 7 · Consiglio su richiesta esplicita

Principio: **nulla di non richiesto.** L'app non propone mai una soluzione di
propria iniziativa. La propone solo dopo un'azione esplicita dell'utente, e solo
entro i vincoli che l'utente ha fissato.

#### La sequenza, obbligatoria in quest'ordine

1. L'utente **fissa l'obiettivo**: cosa, quanto costa, entro quando
2. L'utente **dichiara le leve**: quali categorie considera comprimibili, e di
   quanto al massimo. Nessuna categoria è comprimibile per default.
3. L'utente **chiede** la soluzione, con un'azione visibile e inequivocabile
   (un pulsante «Mostrami come arrivarci», non uno scroll o un hover)
4. **Solo allora** l'app calcola e propone

Registra in stato `adviceRequestedAt`: la richiesta esplicita deve essere un dato
ispezionabile, non un'assunzione. Serve anche in demo, per mostrare che il
confine è applicato e non solo dichiarato.

#### Cosa l'app può proporre

Entro le sole leve dichiarate dall'utente:

- **Il divario**: «Per arrivare a <data> mancano 180 € al mese»
- **La fattibilità**: «Con le riduzioni massime che hai indicato si liberano
  140 € al mese: l'obiettivo si sposta a <data>»
- **Le combinazioni**: le combinazioni delle *sue* leve che chiudono il divario,
  ordinate per impatto. Sono alternative fra cui sceglie lui, non una
  raccomandazione singola.
- **Il costo del tempo**: «A ritmo invariato l'obiettivo arriva a <data>»

#### Cosa resta vietato anche su richiesta

- **Introdurre leve che l'utente non ha dichiarato.** Se non ha marcato
  «alimentari» come comprimibile, l'app non la nomina. Mai.
- **Giudicare le spese.** Vale `agents/policies/no-moralizing.md` senza
  eccezioni: né rimproveri né lodi, in nessuna schermata.
- **Cifre non calcolate.** Vale `agents/policies/numeric-grounding.md` senza
  eccezioni: ogni numero viene dal motore deterministico.
- **Prodotti finanziari.** Nessuna menzione di conti, prestiti, investimenti,
  strumenti. Il divieto è assoluto e non ha carve-out.

La distinzione che regge davanti alla giuria: l'utente ha scelto l'obiettivo e le
leve, l'app ha fatto l'aritmetica. Non è consulenza personalizzata, è un
risolutore di vincoli.

#### Nota visibile all'utente

Sulla schermata del risultato, una riga fissa:

> «Questi numeri derivano dall'obiettivo e dai limiti che hai indicato tu.
>  Non sono una raccomandazione finanziaria.»

### 8 · Adeguare il guardrail — obbligatorio

Il filtro attuale (`src/app/services/guardrail.ts`) blocca `dovresti`, `taglia`,
`risparmia`, `è meglio`, `ti conviene`. Applicato così com'è, **bloccherebbe il
copy della sezione 7**.

Non disattivarlo. Introduci una modalità circoscritta:

```ts
export type Surface = 'educational' | 'solver';

runGuardrail(text, { surface, allowed })
```

- `surface: 'educational'` — comportamento attuale, invariato. È il default per
  ogni schermata.
- `surface: 'solver'` — usabile **solo** sui testi prodotti dopo una richiesta
  esplicita (`adviceRequestedAt` valorizzato). Ammette il condizionale e
  l'ipotetico riferiti alle leve dichiarate. **Continua a bloccare senza
  eccezioni**: moralismo, lodi, cifre non verificate, nomi di prodotti, e
  qualunque categoria non presente fra le leve dichiarate dall'utente.

Quest'ultimo controllo è nuovo e va implementato: il testo prodotto dal solver
non può nominare una categoria che l'utente non ha marcato come comprimibile.
È la garanzia tecnica che l'app resti dentro i vincoli dell'utente.

### 9 · Aggiornare la policy

`agents/policies/no-advice.md` oggi vieta il consiglio in modo assoluto: va
emendato, altrimenti il codice e la specifica si contraddicono — ed è esattamente
il tipo di deriva che la regola di fattorizzazione del repo esiste per impedire.

Aggiungi una sezione **«L'eccezione del solver»** che dichiari: le tre condizioni
necessarie (obiettivo fissato dall'utente, leve dichiarate dall'utente, richiesta
esplicita registrata), cosa resta vietato anche dentro l'eccezione, e il fatto che
l'eccezione vale per una sola superficie dell'app.

Aggiungi i casi corrispondenti nella sezione *Verifica* della policy e i test in
`guardrail.spec.ts`, inclusi due casi negativi:

- testo del solver che nomina una categoria non dichiarata → bloccato
- testo del solver senza `adviceRequestedAt` → bloccato

## Dati di test

Genera **quattro profili sintetici** caricabili da un selettore, che sollecitino
parti diverse del calcolo:

| Profilo | Deve mettere sotto stress |
|---|---|
| Monoreddito con figli | Accantonamenti pesanti e stagionali, margine stretto |
| Giovane prima assunzione | Nessun debito, molte spese ricorrenti piccole |
| Coppia con mutuo | Rata dominante, timeline di liberazione lunga |
| **Margine negativo** | Uscite fisse > entrate: caso limite obbligatorio |

L'ultimo non è opzionale. Deve produrre una descrizione fattuale e **nessuna
esortazione** — è il caso in cui il paternalismo rientra più facilmente.

Dati sintetici verosimili, nessun dato reale, nessun dato identificativo
(no nome, no IBAN, no codice fiscale): non servono a nessun calcolo.

## Vincoli tecnici

- Tutti i calcoli sono **codice deterministico**. L'LLM non produce mai un numero:
  vedi `agents/policies/numeric-grounding.md`
- Output strutturati con Zod in `agents/schemas/`, non parsing via regex
- Model tiering: modello capace solo dove serve giudizio qualitativo
- Ogni passo ha un fallback dichiarato, nessun ciclo illimitato:
  `agents/policies/escalation.md`
- Nessuna chiave API nel codice o in `environment.ts`

## Aggiorna anche

- `agents/schemas/` con i nuovi contratti
- `agents/policies/no-advice.md` — sezione «L'eccezione del solver» (punto 9)
- `agents/policies/no-moralizing.md` se servono casi nuovi nella sezione Verifica
- `agents/workflow.md` con il nuovo flusso
- I test del guardrail

Prima di considerare finito: `npm run build` deve passare e `npx ng test
--watch=false` deve essere verde.

---

## Nota per chi incolla, non da includere nel prompt

Il prompt cita `src/app/services/guardrail.spec.ts`. Verificare che il file sia
nel repository prima di incollare: se non c'è, togliere la riga o crearlo.

Correzione nota da applicare comunque a `guardrail.ts`, indipendentemente da
questo flusso: in JavaScript `\b` è basato su ASCII e non riconosce i confini di
parola con le lettere accentate. `/\bè troppo\b/` non trova «è troppo basso» e
`/bassa familiarità\b/` non trova «bassa familiarità». Sostituire con confini
unicode-aware:

```ts
const START = '(?<![\\p{L}\\p{N}])';
const END   = '(?![\\p{L}\\p{N}])';
const w = (body: string) => new RegExp(START + body + END, 'iu');
```
