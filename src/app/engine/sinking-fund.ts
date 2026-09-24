import type { SpesaFutura } from '@schemas/household';

export interface SinkingEntry {
  descrizione: string;
  importo: number;
  mesiMancanti: number;
  mensile: number;
}

export interface SinkingFundResult {
  entries: SinkingEntry[];
  totalMonthly: number;
}

export function computeSinkingFund(speseFuture: SpesaFutura[]): SinkingFundResult {
  const entries = speseFuture.map(sf => ({
    descrizione: sf.descrizione,
    importo: sf.importo,
    mesiMancanti: sf.mesiMancanti,
    mensile: sf.importo / sf.mesiMancanti,
  }));
  return { entries, totalMonthly: entries.reduce((s, e) => s + e.mensile, 0) };
}
