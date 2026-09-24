# Safe to Spend — Contesto per il Team

> Hagenthon 2026 · Tema 02 Inclusione Finanziaria · Repo: https://github.com/martiftts/safe-to-spend

---

## Stack

- **Angular 22** — standalone components, lazy routing, Angular signals
- **Tailwind CSS v3** — via PostCSS (`postcss.config.js` + `tailwind.config.js`)
- **Claude API** — raw fetch con header `anthropic-dangerous-direct-browser-access: true`
- **Node/npm** — usa sempre `--registry https://registry.npmjs.org` (Accenture Artifactory blocca)

## Setup locale

```bash
npm install --registry https://registry.npmjs.org
npm start        # dev server su http://localhost:4200
```

## Struttura progetto

```
finstart/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   ├── question.model.ts     ✅ Option, Question
│   │   │   └── profile.model.ts      ✅ Archetype, Lesson, StepAnswer, AgentState, UserProfile
│   │   ├── services/
│   │   │   ├── questionnaire.service.ts  ✅ 6 domande hardcoded + signal<answers>
│   │   │   └── claude.service.ts         ✅ workflow 3 step + fallback locale + signal<profile>
│   │   ├── pages/
│   │   │   ├── welcome/              ⬜ da creare (#8)
│   │   │   ├── questionnaire/        ⬜ da creare (#9)
│   │   │   └── profile/              ⬜ da creare (#10)
│   │   ├── app.ts                    ✅ minimale, solo RouterOutlet
│   │   ├── app.html                  ✅ solo <router-outlet />
│   │   ├── app.routes.ts             ✅ lazy routes per / /questionnaire /profile
│   │   └── app.config.ts             ✅ provideRouter
│   ├── environments/
│   │   └── environment.ts            ✅ claudeApiKey: '' (placeholder)
│   └── styles.css                    ✅ @tailwind base/components/utilities
├── agents/
│   ├── prompts/
│   │   ├── step1-analyze.md          ✅ Input: 6 risposte → Output: {painPoint, summary}
│   │   ├── step2-classify.md         ✅ Input: risposte+painPoint → Output: {archetype, score, rationale}
│   │   └── step3-educate.md          ✅ Output: {lessons:[{title,body,emoji}], nextStep}
│   └── workflow.md                   ✅ flusso + Before/After Evidence (D02)
└── presentation/
    └── index.html                    ✅ 4 slide Accenture-branded
```

---

## Routing

| Path | Componente | Stato |
|---|---|---|
| `/` | WelcomePage | ⬜ da creare |
| `/questionnaire` | QuestionnairePage | ⬜ da creare |
| `/profile` | ProfilePage | ⬜ da creare |

Le route usano `loadComponent` (lazy) — già configurate in `app.routes.ts`.

---

## Modelli principali

```typescript
// profile.model.ts
type Archetype = 'novice' | 'aware' | 'practitioner';

interface UserProfile {
  archetype: Archetype;
  score: number;          // 0-20
  painPoint: string;
  summary: string;
  rationale: string;
  lessons: Lesson[];      // sempre 3
  nextStep: string;
}

interface Lesson { title: string; body: string; emoji: string; }
```

---

## Servizi da iniettare

### QuestionnaireService
```typescript
inject(QuestionnaireService)

.questions          // Question[] — 6 domande hardcoded
.answers()          // signal: (string|null)[] — risposte correnti
.setAnswer(id, value)
.isComplete()       // true se tutte e 6 risposte presenti
.toStepAnswers()    // StepAnswer[] per ClaudeService
.reset()
```

### ClaudeService
```typescript
inject(ClaudeService)

.status()           // signal: 'idle'|'step1'|'step2'|'step3'|'done'|'error'
.profile()          // signal: UserProfile | null — risultato dell'ultimo workflow
.setApiKey(key)     // imposta la Claude API key a runtime
await .runWorkflow(answers)  // lancia i 3 step, salva in .profile(), ritorna UserProfile
```

---

## Flusso utente

```
WelcomePage
  → [opzionale] input API key → claudeService.setApiKey()
  → navigate('/questionnaire')

QuestionnairePage
  → mostra domanda[currentStep] da questionnaireService.questions
  → click opzione → questionnaireService.setAnswer(step, value) → step++
  → ultima domanda → await claudeService.runWorkflow(questionnaireService.toStepAnswers())
  → navigate('/profile')

ProfilePage
  → legge claudeService.profile()
  → mostra archetype + score + painPoint + 3 lezioni + nextStep
  → "Ricomincia" → questionnaireService.reset() + navigate('/')
```

---

## Tema visivo (Tailwind)

Usa queste classi arbitrarie per restare coerenti:

| Elemento | Classe Tailwind |
|---|---|
| Background principale | `bg-[#050008]` |
| Surface (card) | `bg-white/[0.03]` |
| Bordo card | `border border-white/10` |
| Viola principale | `bg-[#A100FF]` o `text-[#A100FF]` |
| Viola chiaro (label) | `text-[#BE82FF]` |
| Testo secondario | `text-white/60` |
| Testo muted | `text-white/30` |
| Gradiente titolo | `bg-gradient-to-r from-[#BE82FF] to-[#A100FF] bg-clip-text text-transparent` |

---

## Note importanti

- **Non committare** `src/environments/environment.ts` con la API key vera
- Il `ClaudeService` ha **fallback locale** per ogni step — funziona senza API key
- Angular 22 usa la nuova control flow syntax: `@if`, `@for`, `@switch` (non `*ngIf`, `*ngFor`)
- I componenti sono tutti **standalone** — importare dipendenze direttamente nel `@Component`
- Per `[(ngModel)]` bisogna importare `FormsModule` nel componente

---

## Task aperti (priorità)

| # | Task | Chi |
|---|---|---|
| #8 | WelcomePage — landing + input API key opzionale | Martina |
| #9 | QuestionnairePage — wizard 6 step con progress bar | Vito |
| #10 | ProfilePage — archetype + 3 micro-lezioni | Martina |
| #11 | Tailwind global styles (palette, responsive) | Vito |
| #13 | Risk & Clarity Note in README | Martina |
| #15 | README.md finale (setup + flusso) | Vito |
| #16 | Test golden path | Entrambi |
| #17 | Push finale | Entrambi |
