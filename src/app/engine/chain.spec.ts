import { computeChain } from './chain';
import { HOUSEHOLD_PRESETS } from '../data/household-profiles';

describe('computeChain', () => {
  it('calcola margine positivo per monoreddito con figli', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'monoreddito-figli')!;
    // accantonamento: 320/11 + 800/9 ≈ 29.09 + 88.89 = 117.98
    const acc = 320 / 11 + 800 / 9;
    const result = computeChain(preset.profile, acc);
    // reddito=1600, rate=570, fisse=775
    expect(result.margine).toBeCloseTo(1600 - 570 - 775 - acc, 1);
    expect(result.budgetGiornaliero).toBeCloseTo(result.margine / 30, 2);
  });

  it('calcola margine positivo per giovane prima assunzione', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'giovane-prima-assunzione')!;
    const acc = 900 / 6;
    const result = computeChain(preset.profile, acc);
    expect(result.margine).toBeCloseTo(1300 - 0 - 760 - acc, 1);
  });

  it('calcola margine positivo per coppia con mutuo', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'coppia-mutuo')!;
    const acc = 6000 / 18 + 2500 / 8;
    const result = computeChain(preset.profile, acc);
    const reddito = 3200 + 2000 / 12;
    expect(result.margine).toBeCloseTo(reddito - 850 - 960 - acc, 1);
  });

  it('restituisce margine negativo senza eccezioni', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'margine-negativo')!;
    const result = computeChain(preset.profile, 0);
    expect(result.margine).toBeLessThan(0);
    expect(result.budgetGiornaliero).toBeLessThan(0);
    expect(result.steps).toHaveLength(4);
  });

  it('espone formula leggibile per ogni scalino', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'giovane-prima-assunzione')!;
    const result = computeChain(preset.profile, 0);
    result.steps.forEach(step => {
      expect(step.formula).toMatch(/€/);
    });
  });
});
