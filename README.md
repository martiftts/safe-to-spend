# Safe to Spend

> Hagenthon · Tema 02: Inclusione Finanziaria  
> Accenture Application Engineering · 24 settembre 2026

## Cos'è

**Safe to Spend** aiuta persone con bassa alfabetizzazione finanziaria a capire quanti soldi hanno davvero disponibili a fine mese, partendo da un questionario semplice e restituendo un profilo personalizzato con micro-contenuti educativi.

**Persona target:** Marco, 34 anni, operaio — riceve la busta paga ma non capisce le voci (TFR, INPS, trattenute) e non sa calcolare il suo "safe to spend" reale.

---

## Stack

- **Frontend:** Angular 22 + Tailwind CSS v3
- **AI:** Claude API — workflow agentico 3 step
- **Repo:** https://github.com/martiftts/safe-to-spend

---

## Struttura repo

```
safe-to-spend/
├── src/              # app Angular (componenti, pagine, servizi)
├── agents/           # workflow agentico, prompt strutturati
│   ├── workflow.md   # flusso completo + before/after evidence
│   └── prompts/      # prompt per ogni step AI
├── presentation/     # slide HTML per la demo
└── README.md
```

---

## Workflow agentico

Il motore AI esegue 3 step in sequenza:

1. **Analyze** — legge le 6 risposte e identifica il pain point dominante
2. **Classify** — assegna l'archetype (novice / aware / practitioner)
3. **Educate** — genera 3 micro-contenuti adattati ad archetype e pain point

Ogni step ha prompt strutturato con output JSON e vincoli espliciti.  
Fallback locale attivo se Claude API non risponde entro 10s.

---

## Setup locale

```bash
# installa dipendenze
npm install --registry https://registry.npmjs.org

# avvia dev server
npm start
```

Crea un file `src/environments/environment.ts` con:
```ts
export const environment = {
  claudeApiKey: 'LA_TUA_API_KEY'
};
```

---

## Deliverable

| # | Deliverable | Dove |
|---|-------------|------|
| D01 | User Difficulty Statement | questo README, sezione "Persona target" |
| D02 | Before/After Simplicity Evidence | `agents/workflow.md` |
| D03 | Risk & Clarity Note | sezione sotto |

### D03 — Risk & Clarity Note

**Cosa è stato semplificato:** il linguaggio dei concetti finanziari (TAEG, TFR, tasso) viene tradotto in frasi brevi e concrete adatte al livello dell'utente.  
**Cosa non è stato alterato:** i valori numerici e i significati originali non vengono modificati.  
**Ambiguità evitate:** nessuna raccomandazione di investimento o consiglio finanziario personalizzato. Il sistema educa, non consiglia.  
**Dove è necessaria revisione umana:** i micro-contenuti generati da Claude sono revisionabili dall'utente con un feedback esplicito.
