import type { HouseholdProfile } from '@schemas/household';

export interface OecdResult {
  coefficiente: number;
  redditoEquivalente: number;
}

export interface DebtResult {
  quotaImpegnata: number;
  liberazioneMesi: number;
}

export interface BalanceResult {
  saldoReale: number;
  impegniMensili: number;
}

export interface Indicators {
  oecd: OecdResult;
  debito: DebtResult;
  bilancio: BalanceResult;
}

export function computeIndicators(profile: HouseholdProfile): Indicators {
  const { adulti, minori } = profile.nucleo;
  // OCSE-modificata: 1.0 primo adulto, 0.5 altri adulti, 0.3 minori
  const coefficiente = 1.0 + (adulti - 1) * 0.5 + minori * 0.3;
  const oecd: OecdResult = {
    coefficiente,
    redditoEquivalente: profile.reddito.nettoMensile / coefficiente,
  };

  const totalRate = profile.debiti.reduce((s, d) => s + d.rata, 0);
  const liberazioneMesi = profile.debiti.length > 0
    ? Math.max(...profile.debiti.map(d => d.rateResidue))
    : 0;
  const debito: DebtResult = {
    quotaImpegnata: profile.reddito.nettoMensile > 0 ? totalRate / profile.reddito.nettoMensile : 0,
    liberazioneMesi,
  };

  const fisse = profile.speseFisse.reduce((s, f) => s + f.importo, 0);
  const impegniMensili = totalRate + fisse;
  const bilancio: BalanceResult = {
    saldoReale: profile.saldoAttuale - impegniMensili,
    impegniMensili,
  };

  return { oecd, debito, bilancio };
}
