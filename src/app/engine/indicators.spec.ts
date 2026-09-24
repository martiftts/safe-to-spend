import { computeIndicators } from './indicators';
import { HOUSEHOLD_PRESETS } from '../data/household-profiles';

describe('computeIndicators', () => {
  it('scala OCSE: 1 adulto solo = coefficiente 1.0', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'giovane-prima-assunzione')!;
    const { oecd } = computeIndicators(preset.profile);
    expect(oecd.coefficiente).toBeCloseTo(1.0, 5);
    expect(oecd.redditoEquivalente).toBeCloseTo(1300, 5);
  });

  it('scala OCSE: 2 adulti, 2 minori = coefficiente 2.1', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'monoreddito-figli')!;
    const { oecd } = computeIndicators(preset.profile);
    // 1.0 + 0.5 + 0.3 * 2 = 2.1
    expect(oecd.coefficiente).toBeCloseTo(2.1, 5);
    expect(oecd.redditoEquivalente).toBeCloseTo(1600 / 2.1, 2);
  });

  it('quota impegnata superiore a soglia per margine negativo', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'margine-negativo')!;
    const { debito } = computeIndicators(preset.profile);
    // rate = 750, reddito = 1400: quota = 0.535
    expect(debito.quotaImpegnata).toBeGreaterThan(0.5);
  });

  it('nessun debito: liberazioneMesi = 0', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'giovane-prima-assunzione')!;
    const { debito } = computeIndicators(preset.profile);
    expect(debito.liberazioneMesi).toBe(0);
  });

  it('timeline liberazione = max delle rate residue', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'margine-negativo')!;
    const { debito } = computeIndicators(preset.profile);
    // rate residue: 18, 12, 30 -> max = 30
    expect(debito.liberazioneMesi).toBe(30);
  });

  it('saldo reale = saldo attuale - impegni mensili', () => {
    const preset = HOUSEHOLD_PRESETS.find(p => p.id === 'giovane-prima-assunzione')!;
    const { bilancio } = computeIndicators(preset.profile);
    // impegni = 0 + 760 = 760, saldo = 1800
    expect(bilancio.impegniMensili).toBeCloseTo(760, 5);
    expect(bilancio.saldoReale).toBeCloseTo(1800 - 760, 5);
  });
});
