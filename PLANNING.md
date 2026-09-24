# Safe to Spend — Planning

> Hagenthon 2026 · Tema 02: Inclusione Finanziaria  
> Team: Martina + Vito · Presentazione: 15:30  
> Repo: https://github.com/martiftts/safe-to-spend  
> GitHub Project: da collegare (vedi sotto)

---

## Stato task

| # | Task | Owner | Stato |
|---|------|-------|-------|
| 1 | Setup Angular 22 + Tailwind v3 | Martina | ✅ Done |
| 2 | ARCHITECTURE.md + gap analysis agentica | Claude | ✅ Done |
| 3 | Struttura repo (agents/, presentation/, README) | Claude | ✅ Done |
| 4 | Modelli dati (question.model, profile.model) | Claude | ✅ Done |
| 5 | QuestionnaireService — risposte adattive | Claude | ✅ Done |
| 6 | ClaudeService — workflow 3 step + fallback locale | Claude | ✅ Done |
| 7 | Prompt strutturati in agents/prompts/ | Claude + Vito | ✅ Done |
| 8 | WelcomePage — landing + API key opzionale | Claude | ✅ Done |
| 9 | QuestionnairePage — wizard adattivo (domande condizionali) | Claude | ✅ Done |
| 10 | ProfilePage — safeToSpend + canSpendOn/avoid | Claude | ✅ Done |
| 11 | Stile Tailwind globale (palette custom, responsive) | Vito | ⬜ Todo |
| 12 | agents/workflow.md — Before/After Evidence (D02) | Claude + Vito | ✅ Done |
| 13 | Risk & Clarity Note (D03) in README | Martina | ⬜ Todo |
| 14 | presentation/index.html — slide Accenture-branded | Claude | ✅ Done |
| 15 | README.md finale — setup + flusso agentico | Vito | ⬜ Todo |
| 16 | Test manuale golden path + fix | Entrambi | ⬜ Todo |
| 17 | Push finale + verifica repo pubblico | Entrambi | ⬜ Todo |

**Completati: 13/17** · **Rimanenti: 4** · **Stima rimanente: ~1h**

---

## Evidenze claude-api skill (per valutatori)

Il workflow usa le linee guida del **claude-api skill** (TypeScript):

| Linea guida skill | Implementazione in `claude.service.ts` |
|---|---|
| Modello default: `claude-opus-5` | `const MODEL = 'claude-opus-5'` |
| Adaptive thinking per compiti complessi | `thinking: { type: 'adaptive' }` in ogni chiamata |
| Raw fetch per browser Angular | `fetch(CLAUDE_API, { headers: { 'anthropic-dangerous-direct-browser-access': 'true' } })` |
| Timeout per request lunghe | `AbortController` con `TIMEOUT_MS = 15000` |
| Multi-step pipeline con stato esternalizzato | `AgentState` passato tra step1 → step2 → step3 |
| Fallback se API fallisce | `try/catch` su ogni step con fallback locale completo |

---

## Deliverable del tema (checklist)

- [x] **D01 User Difficulty Statement** — in README + CONTEXT.md (Marco, busta paga)
- [x] **D02 Before/After Simplicity Evidence** — in `agents/workflow.md`
- [ ] **D03 Risk & Clarity Note** — da aggiungere in README (#13)

---

## Criteri di valutazione

| Criterio | Peso | Stato |
|----------|------|-------|
| Profondità agentica | 24% | ✅ 3 step orchestrati, stato esternalizzato, fallback per step |
| Qualità prompt | 19% | ✅ Prompt JSON strutturati, vincoli espliciti, seconda persona |
| Robustezza | 15% | ✅ Timeout 15s, try/catch per step, fallback locale completo |
| Efficienza token | 12% | ✅ max_tokens 512, output format definito, prompt concisi |
| Qualità tecnica | 12% | ✅ Angular 22 standalone, signals, lazy routing, adaptive Q |
| Adeguatezza strumenti | 11% | ✅ Angular + Claude Opus 5 + Tailwind |
| Documentazione | 7% | ⚠️ README incompleto (manca D03) |

---

## Come creare il GitHub Project

1. Vai su https://github.com/martiftts/safe-to-spend
2. Tab **Projects** → **Link a project** → **New project**
3. Scegli template **Board** (kanban)
4. Aggiungi colonne: `Todo` · `In Progress` · `Done`
5. Crea un issue per ogni task ⬜ rimasto (#11 #13 #15 #16 #17)
6. Assegna owner (Martina/Vito)

---

## Vincoli da rispettare

- ❌ Nessun consiglio finanziario (garantito dai prompt + UI disclaimer)
- ❌ Nessun chatbot generico — logica applicativa strutturata in 3 step
- ✅ Seconda persona in tutti i testi ("hai difficoltà" non "l'utente ha")
- ✅ Questionario adattivo (domande condizionali per nucleo familiare)
- ✅ Scenario educativo preciso: safeToSpend + canSpendOn + avoid

---

## Persona utente (D01)

> **Marco, 34 anni, operaio** — riceve la busta paga ma non capisce quanti soldi ha davvero.  
> Non traccia le spese, non sa cosa può permettersi. Vuoi capire il tuo "safe to spend" reale  
> e cosa evitare questo mese sulla base del tuo nucleo familiare e delle tue entrate.
