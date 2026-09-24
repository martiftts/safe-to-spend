# Deliverable · materiale per la presentazione

Contenuti destinati a `index.html`. Spostati qui da `agents/workflow.md`, che descrive come
funziona il sistema e non come lo si racconta.

---

## D01 · User Difficulty Statement

**Chi.** Marco, 27 anni, primo contratto a tempo indeterminato dopo anni di lavoro occasionale.
Riceve la prima busta paga vera della sua vita.

**Dove si blocca.** Legge quattro voci e non ne riconosce nessuna:

| Voce | |
|---|---|
| Retribuzione lorda | € 2.100 |
| INPS dipendente | € 189 |
| IRPEF | € 341 |
| TFR accantonato | € 134 |

Non sa quali di questi soldi siano suoi, quali siano trattenute definitive e quali un
accantonamento che riavrà. Non ha nessuno a cui chiederlo senza imbarazzo.

**Perché è rilevante.** Non è un problema di calcolo: è un problema di vocabolario. Finché quelle
parole non significano nulla, nessuna decisione sul proprio denaro è davvero informata — e la busta
paga arriva ogni mese, per tutta la vita lavorativa.

---

## D02 · Before / After

### Prima

Marco apre la busta paga, non riconosce le voci, la richiude.
**Esito: nessuna decisione, nessuna domanda posta.**

### Dopo

Sei domande, poi tre micro-lezioni calibrate su quello che gli manca:

> **Lordo e netto** — Il lordo è quanto costa il tuo lavoro all'azienda. Il netto è quello che
> arriva sul conto. La differenza non è mai stata tua: sono contributi e imposte trattenuti alla
> fonte.
>
> **Cos'è l'INPS in busta paga** — È la quota che finanzia la tua pensione futura. Viene trattenuta
> ogni mese e versata a tuo nome: non è una tassa che si perde, è un accantonamento.
>
> **Il TFR** — Il datore accantona ogni mese una quota che ti versa quando lasci il lavoro.
> Compare in busta paga anche se non la ricevi adesso.
>
> *Puoi riprendere l'ultima busta paga e cercare le tre voci appena descritte.*

**Esito: Marco sa cosa sta guardando, e ha un'azione concreta da fare subito.**

Da notare per la giuria: **nessuna delle tre lezioni contiene una cifra.** Non è una limitazione
ma l'esito voluto della policy sul grounding numerico — spiegare un concetto non richiede un
numero, e un numero non verificato insegnerebbe una cosa falsa a chi non può accorgersene.

---

## D03 · Risk & Clarity Note

**Cosa è stato semplificato.** Il linguaggio, non il contenuto. «Trattenute alla fonte» resta
«trattenuti alla fonte»: il termine corretto compare, accompagnato dalla spiegazione, invece di
essere sostituito con un'approssimazione.

**Cosa non è stato alterato.** Nessuna cifra della busta paga viene ricalcolata, riassunta o
arrotondata dal sistema. Le lezioni spiegano le voci, non le rielaborano.

**Come è stata evitata l'ambiguità.** Tre politiche applicate da un filtro deterministico, non dal
giudizio di un modello:

| Politica | Cosa impedisce |
|---|---|
| `no-advice` | Che una spiegazione diventi un'indicazione su cosa fare |
| `no-moralizing` | Che il sistema valuti la persona invece di descrivere cosa sa |
| `numeric-grounding` | Che compaia una cifra non presente nell'elenco verificato |

**Limiti che restano.**

1. Il controllo sulle cifre verifica che un numero sia verificato, non che sia usato nel contesto
   giusto (`agents/policies/numeric-grounding.md` § Limite noto).
2. Il questionario è di sei domande: il pain point che ne emerge è un'approssimazione, non una
   diagnosi.
3. Il sistema non ha memoria tra sessioni. Un percorso di apprendimento vero richiederebbe di
   sapere cosa è già stato spiegato.

---

## D04 · Nota sul processo

Da completare prima del freeze. Deve coprire: come è stata usata l'AI, quali output sono stati
rivisti da persone, quali decisioni tecniche sono state prese, quali limiti sono stati identificati.

Elementi già disponibili:

- **Model tiering** — opus solo dove serve giudizio qualitativo, haiku sul resto
  (`agents/README.md`)
- **Un agente in meno** — la classificazione della comprensione è deterministica per scelta:
  è aritmetica, e un LLM avrebbe aggiunto costo, non determinismo e un punto di fallimento
- **Rifattorizzazione delle istruzioni** — il divieto di consulenza era ripetuto in tre prompt con
  tre formulazioni diverse; ora vive in un solo file citato dagli altri
- **Fallback su ogni step** — il workflow non si interrompe mai a metà
