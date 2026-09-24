# FinStart — Planning Task

> Hagenthon · Tema 02: Inclusione Finanziaria  
> Team: 2 persone · Tempo disponibile: 5 ore · Presentazione: 15:30  
> Repo: https://github.com/martiftts/safe-to-spend

---

## Sprint unico (priorità decrescente)

| # | Task | Stima | Stato |
|---|------|-------|-------|
| 1 | Setup progetto Angular + Tailwind | 20 min | ✅ Done |
| 2 | ARCHITECTURE.md + PLANNING.md aggiornati con gap analysis | 20 min | ✅ Done |
| 3 | Struttura cartelle repo (agents/, presentation/, README) | 10 min | ⬜ |
| 4 | Modelli dati (question, answer, AgentState) | 15 min | ⬜ |
| 5 | QuestionnaireService (stato 6 domande) | 15 min | ⬜ |
| 6 | ClaudeService — workflow agentico 3 step + fallback | 40 min | ⬜ |
| 7 | Prompt strutturati in agents/prompts/ (step1, step2, step3) | 20 min | ⬜ |
| 8 | WelcomePage (landing) | 15 min | ⬜ |
| 9 | QuestionnairePage — wizard 6 step | 40 min | ⬜ |
| 10 | ProfilePage — display archetype + micro-contenuti | 30 min | ⬜ |
| 11 | Stile Tailwind globale (palette, responsive) | 20 min | ⬜ |
| 12 | agents/workflow.md — Before/After Evidence (D02) | 15 min | ⬜ |
| 13 | Risk & Clarity Note (D03) in README | 10 min | ⬜ |
| 14 | presentation/index.html (slide HTML Accenture-branded) | 20 min | ⬜ |
| 15 | README.md (setup, flusso agentico, prerequisiti) | 15 min | ⬜ |
| 16 | Test manuale golden path + fix | 20 min | ⬜ |
| 17 | Push finale al repo pubblico GitHub | 10 min | ⬜ |

**Totale stimato: ~5h45min** — da parallelizzare in coppia

---

## Deliverable del tema (checklist)

- [ ] **D01 User Difficulty Statement** — chi è l'utente, difficoltà, processo, rilevanza
- [ ] **D02 Before/After Simplicity Evidence** — in `agents/workflow.md`
- [ ] **D03 Risk & Clarity Note** — in README.md

---

## Criteri di valutazione (pesati) — stato attuale

| Criterio | Peso | Target |
|----------|------|--------|
| Profondità agentica | 24% | Workflow 3 step con stato esternalizzato |
| Qualità prompt | 19% | Prompt strutturati JSON in agents/prompts/ |
| Robustezza | 15% | Fallback locale + timeout + retry |
| Efficienza token | 12% | Prompt concisi, output format definito |
| Qualità tecnica | 12% | Error handling, env var per API key |
| Adeguatezza strumenti | 11% | Angular + Claude API ✅ |
| Documentazione | 7% | README + workflow.md + ARCHITECTURE.md |

---

## Vincoli da rispettare

- ❌ Nessun consiglio finanziario
- ❌ Nessun chatbot generico senza logica applicativa
- ✅ Scenario educativo preciso
- ✅ Capability agentica concreta (3 step orchestrati)

---

## Persona utente (D01)

> **Marco, 34 anni, operaio** — riceve la busta paga ma non capisce le voci (TFR, INPS, trattenute).  
> Si blocca quando deve capire quanti soldi ha davvero disponibili a fine mese.  
> Obiettivo: capire il proprio "safe to spend" reale.
