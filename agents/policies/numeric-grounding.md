# Policy · Nessuna cifra non verificata

**Possiede:** la verificabilità di ogni numero mostrato all'utente.
**Si applica a:** lo step 3 (lezioni) e ogni testo generato che contenga cifre.

---

## La regola

> Una cifra può comparire in una lezione **solo se è nell'elenco dei fatti verificati**.
> Nessun numero proviene dalla memoria del modello.

## Il problema che risolve

Un'app di educazione finanziaria che afferma un numero sbagliato non è inefficace: **insegna una
cosa falsa a chi non ha modo di accorgersene**. È il danno peggiore che questo prodotto possa fare,
e riguarda proprio l'utenza che dichiara di voler aiutare.

I numeri a rischio sono i fatti sul sistema finanziario italiano che un modello conosce in modo
approssimativo o datato: soglia di garanzia dei depositi, aliquote IRPEF, scaglioni, percentuali
contributive, tassi. Sono esattamente il tipo di cifra che sembra plausibile anche quando è
sbagliata.

## Il meccanismo

Un elenco di fatti verificati a mano vive in `../../src/app/data/verified-facts.ts`. Ogni voce ha
il valore, la formulazione ammessa e la fonte.

```
[step 3 genera le lezioni]
        ↓
[estrai tutti i token numerici dal testo]
        ↓
[ogni cifra ∈ elenco verificato?]   → no → rigenera una volta → poi fallback
        ↓ sì
[mostra]
```

**Cifre sempre ammesse**, perché non sono affermazioni sul mondo: i numeri contenuti nelle risposte
dell'utente, e gli ordinali di struttura (*«i 3 passi»*, *«in 2 settimane»*).

## Regola operativa per il prompt

Lo step 3 riceve l'elenco dei fatti verificati pertinenti all'archetipo. Nel testo può usare
**solo quelli**. In assenza di un fatto adatto, la lezione si scrive **senza cifre** — spiegare un
concetto non richiede necessariamente un numero.

> ✅ «Il TFR è un risparmio che il datore accantona per te e che ricevi quando lasci il lavoro.»
> ❌ «Il TFR corrisponde a circa il 6,91% della retribuzione annua.» — cifra non nell'elenco

La seconda frase è peraltro corretta. **Non importa:** se non è nell'elenco verificato, non passa.
La policy non distingue tra cifre giuste e sbagliate, perché il sistema non è in grado di farlo —
distingue tra verificate e non verificate, che è una proprietà controllabile.

## Le regole prescrittive sono un caso a parte

Formulazioni come *«50/30/20»* o *«tre mesi di spese da parte»* non sono fatti: sono **regole
pratiche diffuse**. Non rientrano in questa policy ma in [no-advice.md](no-advice.md), e vanno
attribuite a chi le usa invece di essere presentate come verità.

> ✅ «Una regola diffusa tra i divulgatori suggerisce di dividere il netto in 50/30/20.»
> ❌ «Dividi il tuo netto in 50% fisse, 30% variabili, 20% risparmio.»

## Limite noto

Il controllo verifica che ogni cifra *esista* nell'elenco, non che sia stata *usata nel contesto
giusto*. Una lezione che attribuisse la soglia di 100.000 € al TFR invece che alla garanzia sui
depositi passerebbe il controllo numerico.

Mitigazione attuale: ogni fatto verificato porta con sé la formulazione ammessa, e il prompt riceve
la coppia valore-contesto, non il valore da solo. Mitigazione non implementata per mancanza di
tempo: verificare la co-occorrenza tra cifra e termine associato. Il limite è dichiarato nella
presentazione.

## Verifica

1. Lezione contenente una percentuale assente dall'elenco → rifiutata
2. Lezione contenente `100.000 €` presente nell'elenco → accettata
3. Lezione senza cifre → accettata
4. Lezione che ripete un importo dato dall'utente → accettata
5. Seconda generazione ancora invalida → si attiva il fallback deterministico dello step
