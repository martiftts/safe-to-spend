# Struttura agentica · safe-to-spend

Sistema agentico completo: orchestrazione, prompt, politiche e schemi di output.
È la specifica eseguibile del comportamento dell'applicazione — il codice in `../src/` la
implementa, non la duplica.

---

## Regola di fattorizzazione

> **Ogni regola è scritta una volta sola, nel file che la possiede.
> Gli altri file la citano per nome; nessuno la riscrive.**

Il vincolo è deliberato. Le istruzioni duplicate divergono appena una delle due copie viene
modificata, e un sistema agentico che si contraddice al proprio interno fallisce in modo silenzioso.

Applicazione concreta: il divieto di consulenza finanziaria compare **solo** in
`policies/no-advice.md`. I tre prompt lo citano, non lo ripetono. Prima della rifattorizzazione era
scritto in tre punti diversi con tre formulazioni diverse — il tipo di deriva che questa regola
esiste per impedire.

Ogni file dichiara in testa **cosa possiede** e **cosa delega**.

---

## Mappa

```
agents/
├── README.md              ← questo file: mappa, fattorizzazione, model tiering
├── workflow.md            L'orchestrazione: sequenza, stato, fallback, escalation
│
├── prompts/               Un file per step. Scope, I/O, procedura, limiti.
│   ├── step1-analyze.md   Risposte al questionario → pain point
│   ├── step2-classify.md  Risposte + pain point → archetipo
│   └── step3-educate.md   Archetipo + pain point → 3 micro-lezioni
│
├── policies/              Regole trasversali. Fonte unica di verità.
│   ├── README.md          Indice e meccanismo di applicazione
│   ├── no-advice.md       Divieto di consulenza finanziaria
│   ├── no-moralizing.md   Divieto di giudizio sulle scelte dell'utente
│   ├── numeric-grounding.md  Nessuna cifra non verificata
│   └── escalation.md      Fallback, limiti di iterazione, HITL
│
└── schemas/               Contratti di output strutturato (Zod, fonte unica)
    └── steps.ts           Gli output dei tre step
```

---

## Il flusso

```
[Questionario · 6 domande]
        ↓
  STEP 1 · Analyze     → { painPoint, summary }
        ↓
  STEP 2 · Classify    → { archetype, score, rationale }
        ↓
  STEP 3 · Educate     → { lessons[3], nextStep }
        ↓
  [GUARDRAIL]          → nessuna frase vietata?
        ↓
  [ProfilePage]
```

Ogni step ha un **fallback deterministico**: se la chiamata fallisce, il sistema prosegue con la
classificazione locale a punteggio invece di interrompersi. Dettagli in `workflow.md`.

---

## Model tiering

La scelta del modello è per compito, non uniforme. Il criterio è la difficoltà del compito
linguistico, non il risparmio.

| Step | Modello | Perché |
|---|---|---|
| 1 · Analyze | `claude-opus-5` | Deve inferire da sei risposte eterogenee *dove* una persona si blocca — un giudizio qualitativo, non una classificazione. È l'unico output che condiziona i due step successivi: un errore qui si propaga a tutto il resto. |
| 2 · Classify | `claude-haiku-4-5` | Assegnazione a tre classi con criteri già espliciti nel prompt e un punteggio 0-20. Compito chiuso, nessun ragionamento aperto. |
| 3 · Educate | `claude-haiku-4-5` | Generazione vincolata: tre lezioni, 40 parole ciascuna, registro fissato dall'archetipo. Alto volume di token in output, nessuna inferenza difficile. |

Lo step 2 gira con `output_config: { effort: "low" }`. I system prompt sono identici a ogni
chiamata e viaggiano con `cache_control: { type: "ephemeral" }`: il prefisso viene riusato invece
di essere ripagato.

**Perché non tutto su Opus:** il costo per token di Opus è cinque volte quello di Haiku, e gli step
2 e 3 non usano la capacità in più. Distribuire i modelli sul compito è una decisione di
progettazione, non un ripiego — ed è ciò che distingue un sistema pensato da uno che chiama sempre
il modello più grande.

---

## Stato esternalizzato

Nessuno step mantiene stato interno. Tutto ciò che il sistema sa vive in `AgentState`
(`../src/app/models/profile.model.ts`), che viene passato in input a ogni step e riscritto in output.

Conseguenze volute: ogni step è riproducibile a partire dal suo stato, il workflow si può riprendere
da dove si era interrotto, e il comportamento è ispezionabile aprendo un solo oggetto.

---

## Limiti di iterazione

| Ciclo | Limite | Al superamento |
|---|---|---|
| Timeout singola chiamata | 15 s | Fallback deterministico di quello step |
| Retry su errore di rete o 5xx | 2, backoff esponenziale | Fallback deterministico di quello step |
| Rigenerazione dopo output non valido | 1 | Fallback deterministico di quello step |
| Step falliti tollerati in un workflow | 2 su 3 | Il profilo si completa comunque, con avviso all'utente |

Nessun ciclo è illimitato, nessun fallimento è silenzioso. La fonte unica di questi limiti è
`policies/escalation.md`.

---

## Rapporto con `../AGENTS.md`

Non vanno confusi. `AGENTS.md` nella radice contiene le regole di *build-time* per chi scrive
codice nel progetto. Questa cartella descrive il comportamento *runtime* del sistema agentico.
Scope diversi, nessuna sovrapposizione.
