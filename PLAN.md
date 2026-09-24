# Piano di marcia · safe-to-spend

Due sviluppatori. Aggiornato dopo il merge dei due rami di lavoro.

---

## 1 · La cosa da sapere prima di scrivere una riga

| Criterio | Peso |
|---|---|
| Profondità agentica | 24% |
| Qualità delle istruzioni | 19% |
| Robustezza (fallback, HITL, limiti di iterazione) | 15% |
| Efficienza dei token | 12% |
| Qualità tecnica (error handling, timeout, retry, secrets, **model tiering**) | 12% |
| Adeguatezza degli strumenti | 11% |
| Documentazione | 7% |
| **Qualità dell'idea** | **0%** |

**L'app non porta punti.** Deve funzionare — è un deliverable obbligatorio — ma è il veicolo.
Il 43% vive in `agents/`. Davanti a un bivio su dove spendere mezz'ora, si sceglie `agents/`.

---

## 2 · La decisione presa

Si erano formate due basi divergenti: Angular (Martina) e Next.js (Vito).
**Si tiene l'app di Martina, si porta sopra la struttura agentica di Vito.**

Motivo: l'app vale 0% ed è più avanti; `agents/` vale 43% ed è indipendente dallo stack.
Lo scaffold Next.js è stato scartato.

Ne consegue anche che il prodotto è il **questionario → archetipo → micro-lezioni**, non il
calcolatore di budget giornaliero. Il motore di budget non è stato portato.

---

## 3 · Stato attuale

```
agents/
├── README.md              ✅ mappa, fattorizzazione, model tiering, limiti
├── workflow.md            ✅ orchestrazione, stato, degradazione, token
├── prompts/               ✅ 3 step riscritti: citano le policy, non le ripetono
├── policies/              ✅ 5 file, ciascuno fonte unica della propria regola
└── schemas/steps.ts       ✅ output strutturati Zod + WorkflowTrace

presentation/
├── index.html             🟡 avviata da Martina
└── deliverables.md        ✅ D01-D04, contenuti pronti da portare in HTML

src/                       🟡 app Angular funzionante
```

---

## 4 · Cosa manca, in ordine di punteggio

### 🔴 Da fare per primi — toccano i criteri pesanti

| # | Cosa | Criterio | Chi |
|---|---|---|---|
| 1 | **Togliere la chiave API dal browser.** Oggi `environment.claudeApiKey` + header `anthropic-dangerous-direct-browser-access`. Per un prototipo basta farla inserire a runtime dall'utente e lasciare `environment.claudeApiKey` vuota: nessuna chiave nel bundle. | 05 | A |
| 2 | **Model tiering nel codice.** Oggi tutto su `claude-opus-5`. Step 2 e 3 → `claude-haiku-4-5`, step 2 con `effort: "low"`. | 05 · 04 | A |
| 3 | **Output strutturati.** Sostituire `parseJson` via regex con validazione Zod di `schemas/steps.ts`. Una rigenerazione se non valida, poi fallback. | 01 · 03 | A |
| 4 | **`verified-facts.ts`** — l'elenco dei fatti verificati richiesto da `numeric-grounding.md`, con il controllo sulle cifre delle lezioni. | 01 · 03 | A |
| 5 | **`guardrail.ts`** — filtro deterministico su `no-advice` e `no-moralizing`, applicato a ogni testo in uscita. | 03 | A |
| 6 | **`cache_control: ephemeral`** sui tre system prompt. | 04 | A |
| 7 | **README.md radice** — flusso agentico col diagramma, setup, model tiering, limiti noti. Vale il 7% e si scrive in fretta. | 07 | B |

### 🟡 Poi

| # | Cosa | Chi |
|---|---|---|
| 8 | **Riformulare le lezioni di fallback**: `50/30/20` e «fondo emergenze 3 mesi» sono prescrittive. Vanno attribuite («una regola diffusa…»), vedi `no-advice.md`. | B |
| 9 | **Verificare che archetipo e `score` non compaiano mai in interfaccia** (`no-moralizing.md`). | B |
| 10 | **`presentation/index.html`** — portare i contenuti di `deliverables.md`, brand Accenture. | B |
| 11 | **Avviso di degradazione** quando `degradedCount ≥ 1`. | B |
| 12 | **Test** su guardrail e fallback: sono le sezioni *Verifica* già scritte in fondo a ogni policy. | A |

### ⚠️ Da coordinare a voce, non da fare di iniziativa

**La struttura del repo non è conforme.** Le regole di consegna chiedono
`app/ · agents/ · presentation/ · README.md`, ma il progetto Angular è nella radice.
Spostarlo in `app/` significa toccare `angular.json`, `tsconfig*.json` e gli script di
`package.json`. **Fatelo insieme, a lavoro fermo**, non mentre uno dei due ha modifiche in corso.

---

## 5 · Regole git

- **Push ogni 30 minuti.** Niente lavoro accumulato in locale.
- Prima di ogni push: il progetto deve compilare.
- A tocca `agents/` e i servizi in `src/app/services/`. B tocca componenti, pagine e
  `presentation/`. Così i conflitti tendono a zero.
- Zona condivisa: `agents/schemas/steps.ts`, `package.json`, `README.md`. Si avvisa prima.

---

## 6 · Punti di taglio, decisi adesso

Si taglia in quest'ordine, senza discutere al momento:

1. Il controllo sulle cifre (punto 4) → restano le lezioni di fallback, già verificate
2. Lo step 3 LLM → lezioni deterministiche per archetipo, già scritte
3. Lo step 1 LLM → pain point dalla risposta 5

**Non si taglia mai:** i file di `agents/`, il guardrail, la presentazione, il README.
Un repository con `agents/` completo e un'app parziale prende più punti del contrario.
