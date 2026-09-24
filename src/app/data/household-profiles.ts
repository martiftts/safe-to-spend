import type { HouseholdProfile } from '@schemas/household';

export interface HouseholdPreset {
  id: string;
  label: string;
  note: string;
  profile: HouseholdProfile;
}

const monoredditoConFigli: HouseholdProfile = {
  nucleo: { adulti: 2, minori: 2, percettori: 1 },
  reddito: { nettoMensile: 1600, mensilita: 13, accessoriAnnui: 0 },
  debiti: [
    { tipo: 'mutuo', rata: 420, rateResidue: 180 },
    { tipo: 'finanziamento', rata: 150, rateResidue: 24 },
  ],
  speseFisse: [
    { categoria: 'casa', importo: 180, descrizione: 'condominio + utenze' },
    { categoria: 'trasporti', importo: 120 },
    { categoria: 'alimentari', importo: 350 },
    { categoria: 'salute', importo: 80, descrizione: 'farmaci + pediatra' },
    { categoria: 'abbonamenti', importo: 45 },
  ],
  speseFuture: [
    { descrizione: 'Libri scolastici', importo: 320, mesiMancanti: 11 },
    { descrizione: 'Estate bambini', importo: 800, mesiMancanti: 9 },
  ],
  saldoAttuale: 2100,
};
// margine atteso: 1600 - 570 - 775 - (29+89) ≈ 137

const giovanePrimaAssunzione: HouseholdProfile = {
  nucleo: { adulti: 1, minori: 0, percettori: 1 },
  reddito: { nettoMensile: 1300, mensilita: 13, accessoriAnnui: 0 },
  debiti: [],
  speseFisse: [
    { categoria: 'casa', importo: 450, descrizione: 'affitto' },
    { categoria: 'trasporti', importo: 60, descrizione: 'abbonamento metro' },
    { categoria: 'alimentari', importo: 200 },
    { categoria: 'abbonamenti', importo: 25, descrizione: 'streaming' },
    { categoria: 'abbonamenti', importo: 15, descrizione: 'palestra' },
    { categoria: 'abbonamenti', importo: 10, descrizione: 'cloud' },
  ],
  speseFuture: [
    { descrizione: 'Laptop', importo: 900, mesiMancanti: 6 },
  ],
  saldoAttuale: 1800,
};
// margine atteso: 1300 - 0 - 760 - 150 = 390

const coppiaConMutuo: HouseholdProfile = {
  nucleo: { adulti: 2, minori: 0, percettori: 2 },
  reddito: { nettoMensile: 3200, mensilita: 13, accessoriAnnui: 2000 },
  debiti: [
    { tipo: 'mutuo', rata: 850, rateResidue: 216 },
  ],
  speseFisse: [
    { categoria: 'casa', importo: 220, descrizione: 'utenze + condominio' },
    { categoria: 'trasporti', importo: 200 },
    { categoria: 'alimentari', importo: 400 },
    { categoria: 'abbonamenti', importo: 80 },
    { categoria: 'salute', importo: 60 },
  ],
  speseFuture: [
    { descrizione: 'Ristrutturazione bagno', importo: 6000, mesiMancanti: 18 },
    { descrizione: 'Vacanza estiva', importo: 2500, mesiMancanti: 8 },
  ],
  saldoAttuale: 12500,
};
// margine atteso: 3367 - 850 - 960 - (333+313) ≈ 911

// Profilo obbligatorio: uscite fisse > entrate, margine negativo
const margineNegativo: HouseholdProfile = {
  nucleo: { adulti: 2, minori: 1, percettori: 1 },
  reddito: { nettoMensile: 1400, mensilita: 12, accessoriAnnui: 0 },
  debiti: [
    { tipo: 'prestito_personale', rata: 350, rateResidue: 18 },
    { tipo: 'finanziamento', rata: 220, rateResidue: 12 },
    { tipo: 'cessione_quinto', rata: 180, rateResidue: 30 },
  ],
  speseFisse: [
    { categoria: 'casa', importo: 600, descrizione: 'affitto' },
    { categoria: 'trasporti', importo: 150 },
    { categoria: 'alimentari', importo: 380 },
    { categoria: 'salute', importo: 50 },
    { categoria: 'abbonamenti', importo: 30 },
  ],
  speseFuture: [],
  saldoAttuale: 450,
};
// margine atteso: 1400 - 750 - 1210 = -560

export const HOUSEHOLD_PRESETS: HouseholdPreset[] = [
  {
    id: 'monoreddito-figli',
    label: 'Monoreddito con figli',
    note: 'Accantonamenti pesanti, margine stretto, mutuo + finanziamento.',
    profile: monoredditoConFigli,
  },
  {
    id: 'giovane-prima-assunzione',
    label: 'Giovane, prima assunzione',
    note: 'Nessun debito, molte spese ricorrenti piccole, affitto alto.',
    profile: giovanePrimaAssunzione,
  },
  {
    id: 'coppia-mutuo',
    label: 'Coppia con mutuo',
    note: 'Rata dominante, timeline lunga, reddito doppio.',
    profile: coppiaConMutuo,
  },
  {
    id: 'margine-negativo',
    label: 'Margine negativo',
    note: 'Uscite fisse > entrate. Tono fattuale, zero esortazioni.',
    profile: margineNegativo,
  },
];

export function presetById(id: string): HouseholdPreset | undefined {
  return HOUSEHOLD_PRESETS.find(p => p.id === id);
}
