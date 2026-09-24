# FinStart — Architettura

## Tema
Hagenthon · Tema 02: Inclusione Finanziaria  
Supporto all'educazione finanziaria di base tramite profilazione utente e contenuti adattivi.

## Repository
https://github.com/martiftts/safe-to-spend

## Stack
| Layer | Tecnologia |
|-------|-----------|
| Framework | Angular 22 (standalone components) |
| Stile | Tailwind CSS v3 |
| AI | Claude API (Anthropic) — workflow multi-step |
| Build | Angular CLI / esbuild |

---

## Struttura cartelle (consegna obbligatoria)

```
safe-to-spend/
├── app/                        # applicazione Angular
│   └── src/app/
│       ├── pages/
│       │   ├── welcome/        # landing page
│       │   ├── questionnaire/  # wizard 6 step
│       │   └── profile/        # risultato + contenuti adattivi
│       ├── components/
│       │   ├── step-indicator/
│       │   ├── question-card/
│       │   └── profile-card/
│       └── services/
│           ├── questionnaire.service.ts
│           ├── profile.service.ts
│           └── claude.service.ts  # orchestratore workflow agentico
├── agents/                     # OBBLIGATORIO — workflow, prompt, skills
│   ├── workflow.md             # flusso agentico documentato
│   ├── prompts/
│   │   ├── step1-analyze.md    # analisi risposte questionario
│   │   ├── step2-classify.md   # classificazione profilo
│   │   └── step3-educate.md    # contenuto educativo adattivo
│   └── tools/
│       └── profile-scorer.ts   # tool: calcola score da risposte
├── presentation/               # OBBLIGATORIO — slide HTML branded
│   └── index.html
└── README.md                   # OBBLIGATORIO
```

---

## Workflow Agentico (3 step — criterio C1 24%)

La logica AI non è una singola chiamata ma un'orchestrazione sequenziale:

```
[Risposte questionario]
        ↓
  STEP 1 — Analyze
  Claude legge le 6 risposte e identifica
  il pain point dominante dell'utente
        ↓
  STEP 2 — Classify
  Claude assegna l'archetype (novice/aware/practitioner)
  con motivazione esplicita
        ↓
  STEP 3 — Educate
  Claude genera un percorso educativo personalizzato
  (3 micro-contenuti adattati all'archetype e al pain point)
        ↓
  [ProfilePage mostra risultato]
```

Ogni step ha: prompt strutturato, output format JSON, vincoli espliciti.  
Lo stato intermedio viene esternalizzato nel `QuestionnaireService`.

---

## Routing

```
/             → WelcomePage
/quiz         → QuestionnairePage
/profilo      → ProfilePage
```

---

## Modelli dati

### Question
```ts
{ id: number; text: string; options: Option[]; category: string }
```

### Answer
```ts
{ questionId: number; selectedOption: string; value: number }
```

### AgentState
```ts
{
  answers: Answer[];
  step1Result: { painPoint: string; summary: string };
  step2Result: { archetype: 'novice' | 'aware' | 'practitioner'; score: number; rationale: string };
  step3Result: { lessons: Lesson[]; nextStep: string };
}
```

---

## Robustezza (criterio C3 15%)

- Fallback UI se Claude API non risponde (profilo calcolato localmente)
- Timeout 10s per ogni step con retry 1x
- API key gestita via environment variable (non nel codice)
- Error state visibile all'utente

---

## Vincoli tema rispettati

- ❌ Nessun consiglio finanziario (esplicitato nei prompt)
- ✅ Scenario educativo preciso
- ✅ Capability software concreta (workflow agentico 3 step)
- ✅ Before/After evidence documentata in `agents/workflow.md`
