# Workflow · safe-to-spend

**Possiede:** la sequenza degli step, il passaggio di stato, l'attivazione dei fallback.
**Delega a:** `prompts/` per il comportamento dei singoli step, `policies/escalation.md` per i
limiti e le soglie, `README.md` per il model tiering.

---

## Il flusso

```
[Questionario · 6 domande]
        │
        ▼
  STEP 1 · Analyze        opus-5
  in:   answers[]
  out:  { painPoint, summary }                    ── fallisce ─▶ fallbackStep1
        │                                                        (pain point = risposta 5)
        ▼
  STEP 2 · Classify       haiku-4-5 · effort low
  in:   answers[] + painPoint
  out:  { archetype, score, rationale }           ── fallisce ─▶ fallbackStep2
        │                                                        (punteggio locale)
        ▼
  STEP 3 · Educate        haiku-4-5
  in:   archetype + painPoint + fatti verificati
  out:  { lessons[3], nextStep }                  ── fallisce ─▶ fallbackStep3
        │                                                        (lezioni per archetipo)
        ▼
  [GUARDRAIL]  deterministico, zero token
  no-advice · no-moralizing · numeric-grounding
        │
        ├─ viola ─▶ 1 rigenerazione ─▶ viola ancora ─▶ fallback dello step
        │
        ▼
  [ProfilePage]  + avviso se degradedCount ≥ 1
```

## Stato

Lo stato vive interamente in `AgentState` (`../src/app/models/profile.model.ts`), passato in input
a ogni step e riscritto in output. Nessuno step conserva stato interno.

Accanto a esso, `WorkflowTrace` (`schemas/steps.ts`) registra per ciascuno step il modello usato,
i tentativi, la durata e l'eventuale motivo di degradazione. Serve a due cose: decidere se mostrare
l'avviso all'utente, e rendere il comportamento del sistema ispezionabile in demo invece che
soltanto dichiarato.

## Sequenzialità

Gli step sono strettamente sequenziali: ciascuno consuma l'output del precedente. Non sono
parallelizzabili, e non c'è vantaggio nel tentarlo — la latenza totale è dominata dallo step 3,
che è anche l'ultimo.

**Il workflow non si interrompe mai a metà.** Uno step fallito attiva il proprio fallback e la
catena prosegue: il profilo si completa sempre, eventualmente degradato. La regola e le sue soglie
sono in `policies/escalation.md`.

## Degradazione visibile

`degradedCount ≥ 1` → il profilo si mostra preceduto da una riga esplicita sul fatto che parte dei
contenuti è generica. `degradedCount = 3` → non si finge un risultato: errore, risposte conservate,
possibilità di riprovare.

Il testo esatto degli avvisi e il motivo di questa scelta sono in `policies/escalation.md`
§ I due punti di escalation verso l'utente.

## Efficienza dei token

| Misura | Effetto |
|---|---|
| Model tiering (opus solo sullo step 1) | Gli step 2 e 3 costano un quinto per token |
| `effort: "low"` sullo step 2 | Attribuzione a soglie, non serve profondità |
| `cache_control: ephemeral` sui system prompt | I prompt sono identici a ogni chiamata: il prefisso non si ripaga |
| Budget di parole per step (50 / 30 / 150) | Vincolo esplicito nel prompt, non solo `max_tokens` |
| `painPoint` entro 160 caratteri | Viaggia in input a due step: ogni parola si paga tre volte |

## Deliverable

L'evidenza Before/After (D02) e la nota sui rischi (D03) vivono nella presentazione
(`../presentation/`), non qui. Questo file descrive come funziona il sistema, non come lo si
racconta.
