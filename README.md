# Safe to Spend

> Hagenthon · Tema 02 · Inclusione Finanziaria
> Accenture Application Engineering · settembre 2026

Un percorso di educazione finanziaria di base che parte da sei domande e restituisce tre
micro-lezioni calibrate su quello che alla persona non è ancora stato spiegato.

**Spiega. Non consiglia.** Il confine non è retorico: è applicato da un filtro deterministico su
ogni testo che raggiunge l'utente.

---

## Il problema

Marco, 27 anni, primo contratto a tempo indeterminato. Apre la busta paga e legge quattro voci:
retribuzione lorda, INPS, IRPEF, TFR. Non sa quali di quei soldi siano suoi, quali siano trattenute
definitive e quali un accantonamento che riavrà.

Non è un problema di calcolo, è un problema di vocabolario. Finché quelle parole non significano
nulla, nessuna decisione sul proprio denaro è davvero informata — e la busta paga arriva ogni mese
per tutta la vita lavorativa.

---

## Il flusso agentico

```
[Questionario · 6 domande]
        │
        ▼
  STEP 1 · Analyze        claude-opus-5 · adaptive thinking
  in:   answers[]
  out:  { painPoint, summary }                    ── fallisce ─▶ fallback deterministico
        │
        ▼
  STEP 2 · Classify       claude-haiku-4-5 · effort low
  in:   answers[] + painPoint
  out:  { archetype, score, rationale }           ── fallisce ─▶ punteggio locale
        │
        ▼
  STEP 3 · Educate        claude-haiku-4-5
  in:   archetype + painPoint + fatti verificati
  out:  { lessons[3], nextStep }                  ── fallisce ─▶ lezioni per archetipo
        │
        ▼
  [GUARDRAIL]  deterministico, zero token
  no-advice · no-moralizing · numeric-grounding
        │
        ├─ viola ─▶ 1 rigenerazione ─▶ viola ancora ─▶ fallback dello step
        │
        ▼
  [Profilo]  + avviso se almeno uno step è degradato
```

Gli step sono sequenziali: ciascuno consuma l'output del precedente. Lo stato vive interamente in
`AgentState`, passato in input a ogni step e riscritto in output — nessuno step conserva stato
interno.

**Il workflow non si interrompe mai a metà.** Uno step fallito attiva il proprio percorso
deterministico e la catena prosegue.

---

## Tre decisioni di progetto

### 1 · L'AI non produce mai un numero non verificato

Una cifra può comparire in una lezione solo se è nell'elenco dei fatti verificati a mano
(`src/app/data/verified-facts.ts`), ciascuno con fonte e data. Il controllo estrae i token numerici
dal testo generato e rifiuta quelli fuori elenco.

L'elenco è volutamente corto. Un'app di educazione finanziaria che afferma un numero sbagliato
insegna una cosa falsa a chi non può accorgersene: è il danno peggiore che questo prodotto possa
fare. Tre lezioni senza cifre valgono più di una lezione con una cifra inventata.

### 2 · Model tiering per compito, non uniforme

| Step | Modello | Perché |
|---|---|---|
| 1 · Analyze | `claude-opus-5` | Giudizio qualitativo su sei risposte eterogenee, e unico output che condiziona entrambi gli step successivi: un errore qui si propaga a tutto il resto. |
| 2 · Classify | `claude-haiku-4-5` | Attribuzione a tre classi con criteri già espliciti nel prompt. Compito chiuso. |
| 3 · Educate | `claude-haiku-4-5` | Generazione vincolata: tre lezioni, 40 parole, registro fissato. Molti token in uscita, nessuna inferenza difficile. |

`adaptive thinking` solo sullo step 1: Haiku 4.5 non appartiene alla famiglia 4.6+ e rifiuterebbe
il parametro.

### 3 · Un componente in meno, deliberatamente

La classificazione della comprensione era prevista come quarto agente LLM. È stata resa
deterministica dopo aver guardato cosa avrebbe dovuto fare davvero: confrontare distanze numeriche.
Un modello avrebbe aggiunto costo, non determinismo e un punto di fallimento, senza aggiungere
capacità.

Un agente in più non rende un sistema più agentico. Gli strumenti si scelgono per il compito.

---

## Robustezza

| Limite | Valore | Al superamento |
|---|---|---|
| Timeout per chiamata | 15 s | Fallback dello step |
| Retry su rete o 5xx | 2, backoff esponenziale | Fallback dello step |
| Retry su 4xx | **0** | Fallback immediato: una chiave mancante non si risolve ritentando |
| Rigenerazione su output invalido o violazione | 1 | Fallback dello step |
| Step degradati tollerati | 2 su 3 | Profilo mostrato **con avviso esplicito** |
| Step degradati = 3 | — | Errore, risposte conservate, possibilità di riprovare |

Nessun ciclo è illimitato, nessuna degradazione è nascosta all'utente. `WorkflowTrace` registra per
ogni step il modello, i tentativi, la durata e l'eventuale motivo di degradazione.

## Efficienza dei token

- **Tiering** — gli step 2 e 3 costano un quinto per token rispetto a Opus
- **`effort: "low"`** sullo step 2
- **`cache_control: ephemeral`** sul prefisso stabile dei system prompt, identico a ogni chiamata
- **Budget di parole per step** (50 / 30 / 150) dichiarati nel prompt, non solo `max_tokens`
- **`painPoint` entro 160 caratteri** — viaggia in input a due step, quindi ogni parola si paga tre volte
- **Guardrail deterministico** invece di un secondo passaggio LLM: zero token per la verifica

---

## Setup

```bash
npm install --registry https://registry.npmjs.org   # Artifactory Accenture blocca il default
npm start                                            # http://localhost:4200
```

### La chiave API

**Non va messa in nessun file.** `src/environments/environment.ts` resta con `claudeApiKey: ''`.

La chiave si inserisce a runtime dal pannello *Modalità di esecuzione*: vive in `sessionStorage` e
sparisce alla chiusura del browser. Non entra nel bundle né nel repository.

### Modalità locale

Senza chiave l'applicazione funziona lo stesso: i tre step usano i percorsi deterministici e il
profilo si completa. Non è un ripiego ma la configurazione in cui il sistema è interamente
riproducibile — ed è il modo in cui la degradazione controllata si può mostrare invece che
raccontare.

---

## Mappa del repository

```
├── src/                    App Angular 22 (componenti, pagine, servizi)
├── agents/                 Il sistema agentico: la specifica eseguibile
│   ├── README.md           Mappa, regola di fattorizzazione, tiering, limiti
│   ├── workflow.md         Orchestrazione, stato, degradazione
│   ├── prompts/            Un file per step: scope, procedura, esempi
│   ├── policies/           Le regole trasversali, ciascuna fonte unica
│   └── schemas/steps.ts    Contratti di output (Zod), importati dall'app
├── presentation/           Presentazione e materiale dei deliverable
└── README.md               Questo file
```

### Quale file per cosa

Per evitare sovrapposizioni, ogni documento ha un ambito dichiarato:

| File | Ambito |
|---|---|
| `README.md` | Il progetto per chi lo legge da fuori: cosa fa, come funziona, come si avvia |
| `agents/README.md` | La specifica del sistema agentico |
| `agents/policies/` | Le regole. **Ogni regola è scritta una volta sola**, nel file che la possiede |
| `CONTEXT.md` · `PLAN.md` | Documenti interni di lavoro: stack, spartizione, cose da fare |
| `presentation/deliverables.md` | I contenuti D01-D04 per la presentazione |

`agents/schemas/steps.ts` è importato dall'app tramite l'alias in `tsconfig.app.json`: gli schemi
non hanno una copia dentro `src/`, sono la stessa fonte compilata.

---

## Limiti noti

1. **Il controllo sulle cifre verifica che un numero sia verificato, non che sia usato nel contesto
   giusto.** Una lezione che attribuisse la soglia dei 100.000 € al TFR invece che alla garanzia sui
   depositi passerebbe il controllo.
2. **`verified-facts.ts` contiene oggi una sola voce.** Aliquote IRPEF, contributi INPS e quota TFR
   sono elencati come da verificare: finché non lo sono, le lezioni su quei temi si scrivono senza
   cifre.
3. **La chiave transita dal browser.** Per un prototipo è accettabile con inserimento a runtime;
   in produzione servirebbe un proxy server-side.
4. **Sei domande sono un'approssimazione.** Il pain point che ne emerge non è una diagnosi.
5. **Nessuna memoria tra sessioni.** Un percorso di apprendimento vero richiederebbe di sapere cosa
   è già stato spiegato.

---

## Deliverable

| # | Dove |
|---|---|
| D01 · User Difficulty Statement | [`presentation/deliverables.md`](presentation/deliverables.md) |
| D02 · Before / After Evidence | [`presentation/deliverables.md`](presentation/deliverables.md) |
| D03 · Risk & Clarity Note | [`presentation/deliverables.md`](presentation/deliverables.md) |
| D04 · Nota sul processo | [`presentation/deliverables.md`](presentation/deliverables.md) |
