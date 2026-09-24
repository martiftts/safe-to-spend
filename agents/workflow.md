# Workflow Agentico — Safe to Spend

## Flusso

```
[Questionario 6 domande]
        ↓
  STEP 1 — Analyze        (prompt: step1-analyze.md)
  Input:  6 risposte JSON
  Output: { painPoint, summary }
        ↓
  STEP 2 — Classify       (prompt: step2-classify.md)
  Input:  risposte + painPoint
  Output: { archetype, score, rationale }
        ↓
  STEP 3 — Educate        (prompt: step3-educate.md)
  Input:  archetype + painPoint
  Output: { lessons: [3 micro-contenuti], nextStep }
        ↓
  [ProfilePage]
```

Stato esternalizzato in `QuestionnaireService` tra uno step e l'altro.  
Fallback: se un step fallisce, il sistema usa la classificazione locale (score numerico).

---

## Before / After Evidence (Deliverable D02)

### BEFORE — senza la soluzione

Marco riceve la sua busta paga. Vede:
- Retribuzione lorda: €2.100
- INPS dipendente: €189
- IRPEF: €341
- TFR accantonato: €134

Non sa cosa significano queste voci. Non sa quanti soldi può spendere.  
**Risultato: si blocca, non prende decisioni informate.**

### AFTER — con Safe to Spend

Dopo il questionario, Marco riceve:

> "Il tuo **safe to spend** stimato è circa **€1.400/mese**.  
> L'INPS e l'IRPEF sono trattenute obbligatorie: non sono soldi tuoi.  
> Il TFR è un risparmio forzato che riceverai quando lasci il lavoro.  
> Vuoi capire come gestire i €1.400 rimasti?"

**Risultato: Marco capisce la sua situazione reale in 30 secondi.**
