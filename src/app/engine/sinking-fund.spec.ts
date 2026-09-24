import { computeSinkingFund } from './sinking-fund';
import { HOUSEHOLD_PRESETS } from '../data/household-profiles';

describe('computeSinkingFund', () => {
  it('restituisce zero per nessuna spesa futura', () => {
    const result = computeSinkingFund([]);
    expect(result.totalMonthly).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it('calcola mensile corretto: importo / mesiMancanti', () => {
    const result = computeSinkingFund([
      { descrizione: 'Laptop', importo: 900, mesiMancanti: 6 },
    ]);
    expect(result.entries[0].mensile).toBeCloseTo(150, 5);
    expect(result.totalMonthly).toBeCloseTo(150, 5);
  });

  it('somma correttamente piu spese future (monoreddito con figli)', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'monoreddito-figli')!;
    const result = computeSinkingFund(preset.profile.speseFuture);
    const atteso = 320 / 11 + 800 / 9;
    expect(result.totalMonthly).toBeCloseTo(atteso, 2);
    expect(result.entries).toHaveLength(2);
  });

  it('margine negativo: spese future vuote, totalMonthly = 0', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'margine-negativo')!;
    const result = computeSinkingFund(preset.profile.speseFuture);
    expect(result.totalMonthly).toBe(0);
  });
});
