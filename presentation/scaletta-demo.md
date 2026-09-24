# Scaletta demo · 5 minuti

Due voci che si alternano. Chi non parla guida lo schermo.

**Prima di salire:** browser già aperto sulla welcome, modalità locale attiva,
nessuna chiave inserita. Niente da digitare durante la demo.

---

## 0:00 — 0:40 · Il problema (Martina)

Marco, 27 anni, primo contratto a tempo indeterminato. Apre la busta paga e legge
quattro voci: lordo, INPS, IRPEF, TFR. Non sa quali di quei soldi siano suoi.

> «Non è un problema di calcolo. È un problema di vocabolario. E la busta paga
> arriva ogni mese, per tutta la vita lavorativa.»

Niente slide di contesto sul mercato. Si parte dalla persona e si arriva subito
allo schermo.

## 0:40 — 1:10 · La scelta che inquadra tutto (Vito)

**Dirlo prima che lo chiedano:**

> «Questa demo gira senza chiamate esterne. Non è un ripiego: il sistema è
> progettato per funzionare anche quando il modello non risponde, e ve lo
> mostriamo perché è la parte di cui andiamo più fieri.»

Trasforma il vincolo in una scelta di progetto e copre il criterio sulla
robustezza nei primi trenta secondi.

## 1:10 — 2:30 · Il percorso (Martina)

Preset **«Famiglia con margine stretto»**.

- Sei domande, linguaggio quotidiano, nessun termine bancario
- La domanda sui figli compare solo se serve: il questionario si adatta
- Si arriva al risultato

Sul risultato, una frase sola:

> «Questo numero non l'ha prodotto il modello. L'ha calcolato il codice.»

## 2:30 — 3:00 · Gli esiti cambiano davvero (Vito)

Preset **«Single con margine ampio»**. Stesso percorso, risultato visibilmente
diverso.

Serve a rispondere alla domanda che la giuria si sta facendo — *è precalcolato?* —
prima che la faccia.

## 3:00 — 3:50 · L'architettura (Vito)

Qui si vince o si perde. Tre cose, una frase ciascuna:

1. **L'AI non tocca mai un numero.** Gli agenti lavorano solo sul linguaggio,
   agli estremi della pipeline. Il centro è codice deterministico.
2. **Model tiering.** Il modello capace solo dove serve giudizio qualitativo;
   sugli altri due step uno più piccolo, perché il compito è chiuso.
3. **Il guardrail.** — *e qui lo si mostra mentre blocca.*

Il momento del guardrail è il più forte della presentazione: le politiche in
`agents/` smettono di essere documentazione e diventano una cosa che si vede
funzionare.

## 3:50 — 4:30 · Rischi e limiti (Martina)

Dichiarati, non nascosti. Tre, non di più:

- Il controllo sulle cifre verifica che un numero sia verificato, **non che sia
  usato nel contesto giusto**
- L'elenco dei fatti verificati contiene oggi **una sola voce**: le aliquote non
  sono state inserite perché non erano verificabili con certezza. Le lezioni su
  quei temi restano senza cifre.
- La chiave transita dal browser: per un prototipo è accettabile con inserimento
  a runtime, in produzione servirebbe un proxy

Un limite dichiarato bene vale più di un limite nascosto male. E il secondo punto
è una decisione di progetto, non una mancanza: vale la pena dirlo così.

## 4:30 — 5:00 · Cosa c'è oltre (Vito)

Il flusso bancario è **progettato e specificato**, non implementato:
`PROMPT-flusso-bancario.md`.

Il pezzo interessante da raccontare è il confine:

> «Il consiglio finanziario è vietato dal tema. Ma un utente che fissa un
> obiettivo e dichiara lui quali spese è disposto a comprimere non sta chiedendo
> un consiglio: sta chiedendo un calcolo. Abbiamo scritto la policy che regge
> quella distinzione prima di scrivere il codice.»

---

## Se qualcuno chiede

**«Perché non avete usato il modello più potente ovunque?»**
Perché due dei tre step fanno un compito chiuso, con criteri già espliciti nel
prompt. Un modello più capace non produce una classificazione migliore, solo più
costosa. Gli strumenti si scelgono per il compito.

**«Il guardrail non è troppo rigido?»**
È deterministico e a volte blocca frasi accettabili. È voluto: un falso positivo
costa una rigenerazione, un falso negativo manda in produzione un consiglio
finanziario.

**«Dove ha contribuito l'AI e dove siete intervenuti voi?»**
L'AI ha scritto gran parte del codice e delle politiche. Gli interventi umani
decisivi sono stati tre: togliere un agente che non serviva, rifiutare le cifre
non verificabili, e riscrivere il confine fra spiegare e consigliare.

---

## Cosa non fare

- **Non compilare il questionario a mano.** Ci sono i preset.
- **Non scusarsi** per la modalità locale. È una scelta, e va detta come tale.
- **Non leggere le slide.** Lo schermo mostra l'app, non il testo che state dicendo.
- **Non sforare.** A 5:00 si smette, anche a metà frase: il tempo residuo è delle
  domande, ed è lì che si recupera.
