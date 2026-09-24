/**
 * Set di risposte precaricate per la demo.
 *
 * Servono a non compilare il questionario a mano davanti alla giuria e a
 * mostrare che il sistema produce esiti diversi su situazioni diverse:
 * i tre preset cadono deliberatamente nei tre profili di spesa.
 *
 * Le chiavi sono gli `id` delle domande in `questionnaire.service.ts`.
 * La domanda 1 (quanti figli) compare solo se la 0 vale `con-figli`.
 */

export interface DemoPreset {
  id: string;
  label: string;
  /** Cosa mette sotto stress: serve a chi conduce la demo. */
  note: string;
  /** Margine atteso dal calcolo deterministico, in euro al mese. */
  expectedMargin: number;
  answers: Record<number, string>;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'margine-stretto',
    label: 'Famiglia con margine stretto',
    note: 'Due figli, un reddito medio-basso, rate significative. Il margine è quasi nullo: è il caso in cui il tono paternalistico rientra più facilmente.',
    expectedMargin: 50, // 1500 − 1100 − 350
    answers: {
      0: 'con-figli',
      1: '2-figli',
      2: '1000-2000',
      3: '800-1400',
      4: 'si-significativi',
      5: 'non-traccio',
      6: 'piu-cose',
    },
  },
  {
    id: 'equilibrio',
    label: 'Coppia in equilibrio',
    note: 'Margine presente ma non ampio, una spesa futura già nota. È il percorso centrale della demo.',
    expectedMargin: 750, // 1500 − 600 − 150
    answers: {
      0: 'coppia',
      2: '1000-2000',
      3: '400-800',
      4: 'si-piccoli',
      5: 'appunto',
      6: 'vacanza-evento',
    },
  },
  {
    id: 'margine-ampio',
    label: 'Single con margine ampio',
    note: 'Nessun debito, reddito alto, già traccia le spese. Serve a mostrare che gli esiti cambiano davvero: confrontatelo con il primo.',
    expectedMargin: 3400, // 4000 − 600 − 0
    answers: {
      0: 'solo',
      2: '>3500',
      3: '400-800',
      4: 'no',
      5: 'app-excel',
      6: 'no',
    },
  },
];

export function presetById(id: string): DemoPreset | undefined {
  return DEMO_PRESETS.find((p) => p.id === id);
}
