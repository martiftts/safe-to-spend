import type { Archetype } from '@schemas/steps';

/**
 * Fatti numerici verificati a mano.
 *
 * Una cifra può comparire in una lezione SOLO se è qui dentro.
 * Regola e razionale: ../../../agents/policies/numeric-grounding.md
 *
 * ⚠️ REGOLA DI MANUTENZIONE
 * Ogni voce richiede: valore, formulazione ammessa, fonte e data di verifica.
 * Una voce senza fonte non va aggiunta. Aliquote, scaglioni e percentuali
 * contributive cambiano: se la data di verifica è vecchia, la voce si rimuove
 * invece di essere lasciata "probabilmente giusta".
 *
 * L'elenco è volutamente corto. Un'app di educazione finanziaria che afferma
 * un numero sbagliato insegna una cosa falsa a chi non può accorgersene:
 * è il danno peggiore che questo prodotto possa fare. Meglio tre lezioni
 * senza cifre che una lezione con una cifra inventata.
 */

export interface VerifiedFact {
  /** Il valore numerico, come compare nel testo. */
  value: number;
  /** Come va scritto nel testo italiano. */
  display: string;
  /** Il contesto in cui la cifra è corretta. Il prompt riceve la coppia, non il valore nudo. */
  context: string;
  source: string;
  verifiedOn: string;
  /** A quali archetipi è pertinente. */
  forArchetypes: Archetype[];
}

export const VERIFIED_FACTS: VerifiedFact[] = [
  {
    value: 100000,
    display: '100.000 €',
    context:
      'Soglia di garanzia dei depositi bancari, per depositante e per banca, coperta dal Fondo Interbancario di Tutela dei Depositi.',
    source: 'Direttiva UE 2014/49 sui sistemi di garanzia dei depositi (DGSD), recepita in Italia',
    verifiedOn: '2026-09-24',
    forArchetypes: ['novice', 'aware', 'practitioner'],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DA VERIFICARE PRIMA DELLA DEMO — non aggiungere senza fonte e data.
  //
  // Candidati utili ma soggetti a variazione annuale, quindi da controllare
  // sul sito dell'ente prima di inserirli:
  //   · scaglioni e aliquote IRPEF vigenti          → Agenzia delle Entrate
  //   · aliquota contributiva INPS lavoratore dip.  → INPS, circolare annuale
  //   · quota di accantonamento TFR                 → art. 2120 Codice Civile
  //
  // Finché non sono verificati, le lezioni su questi temi si scrivono SENZA
  // cifre: spiegare cos'è l'INPS non richiede di dirne l'aliquota.
  // ─────────────────────────────────────────────────────────────────────────
];

/** I fatti pertinenti a un archetipo, per il prompt dello step 3. */
export function factsFor(archetype: Archetype): VerifiedFact[] {
  return VERIFIED_FACTS.filter((f) => f.forArchetypes.includes(archetype));
}

/** L'insieme dei valori ammessi nel testo generato, per il controllo di grounding. */
export function allowedValues(archetype: Archetype): ReadonlySet<number> {
  return new Set(factsFor(archetype).map((f) => f.value));
}

/** Blocco testuale da iniettare nel prompt dello step 3. */
export function factsBlock(archetype: Archetype): string {
  const facts = factsFor(archetype);
  if (facts.length === 0) {
    return 'Nessun fatto numerico verificato disponibile: scrivi le lezioni senza cifre.';
  }
  return [
    'Fatti verificati utilizzabili (nessun altro numero è ammesso):',
    ...facts.map((f) => `- ${f.display} — ${f.context}`),
  ].join('\n');
}
