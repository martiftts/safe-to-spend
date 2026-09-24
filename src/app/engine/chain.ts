import type { HouseholdProfile } from '@schemas/household';

export interface ChainStep {
  label: string;
  amount: number;
  running: number;
  formula: string;
}

export interface ChainResult {
  steps: ChainStep[];
  margine: number;
  budgetGiornaliero: number;
}

export function computeChain(profile: HouseholdProfile, accantonamentoMensile = 0): ChainResult {
  const reddito = profile.reddito.nettoMensile + profile.reddito.accessoriAnnui / 12;
  const rate = profile.debiti.reduce((s, d) => s + d.rata, 0);
  const fisse = profile.speseFisse.reduce((s, f) => s + f.importo, 0);
  const acc = accantonamentoMensile;

  const r0 = reddito;
  const r1 = r0 - rate;
  const r2 = r1 - fisse;
  const r3 = r2 - acc;

  const steps: ChainStep[] = [
    { label: 'Reddito netto mensile', amount: reddito, running: r0, formula: `€ ${f(reddito)}` },
    { label: 'Rate e debiti', amount: -rate, running: r1, formula: `${f(r0)} − ${f(rate)} = ${f(r1)}` },
    { label: 'Spese fisse', amount: -fisse, running: r2, formula: `${f(r1)} − ${f(fisse)} = ${f(r2)}` },
    { label: 'Accantonamento spese future', amount: -acc, running: r3, formula: `${f(r2)} − ${f(acc)} = ${f(r3)}` },
  ];

  return { steps, margine: r3, budgetGiornaliero: r3 / 30 };
}

function f(n: number): string {
  return `€ ${n.toFixed(2)}`;
}
