import { Injectable, signal, computed } from '@angular/core';
import type { HouseholdProfile, SpesaFissa } from '@schemas/household';
import { computeSinkingFund } from '../engine/sinking-fund';
import { computeChain } from '../engine/chain';
import { computeIndicators } from '../engine/indicators';
import { HOUSEHOLD_PRESETS, type HouseholdPreset } from '../data/household-profiles';

export type Categoria = 'casa' | 'trasporti' | 'alimentari' | 'salute' | 'abbonamenti' | 'tempo_libero' | 'altro';

export interface Movimento {
  id: string;
  descrizione: string;
  importoMensile: number;
  categoria: Categoria;
  ricorrente: boolean;
}

export interface SpesaPerCategoria {
  categoria: Categoria;
  importoMensile: number;
  movimenti: Movimento[];
}

export interface BankingData {
  profile: HouseholdProfile;
  movimenti: Movimento[];
  spesaPerCategoria: SpesaPerCategoria[];
  ricorrenti: Movimento[];
}

function normalizeCategoria(c: SpesaFissa['categoria']): Categoria {
  return c as Categoria;
}

function movimentiDaProfile(profile: HouseholdProfile): Movimento[] {
  const result: Movimento[] = [];

  // Spese fisse -> movimenti ricorrenti
  for (const sf of profile.speseFisse) {
    result.push({
      id: `fissa-${sf.categoria}-${sf.importo}`,
      descrizione: sf.descrizione ?? sf.categoria.replace('_', ' '),
      importoMensile: sf.importo,
      categoria: normalizeCategoria(sf.categoria),
      ricorrente: true,
    });
  }

  // Debiti -> movimenti ricorrenti nella categoria casa o altro
  for (const d of profile.debiti) {
    const categoria: Categoria = d.tipo === 'mutuo' ? 'casa' : 'altro';
    result.push({
      id: `debito-${d.tipo}-${d.rata}`,
      descrizione: d.tipo.replace('_', ' '),
      importoMensile: d.rata,
      categoria,
      ricorrente: true,
    });
  }

  return result;
}

function groupByCategoria(movimenti: Movimento[]): SpesaPerCategoria[] {
  const map = new Map<Categoria, Movimento[]>();
  for (const m of movimenti) {
    const list = map.get(m.categoria) ?? [];
    list.push(m);
    map.set(m.categoria, list);
  }
  return Array.from(map.entries()).map(([categoria, movs]) => ({
    categoria,
    importoMensile: movs.reduce((s, m) => s + m.importoMensile, 0),
    movimenti: movs,
  })).sort((a, b) => b.importoMensile - a.importoMensile);
}

@Injectable({ providedIn: 'root' })
export class BankingService {
  readonly selectedPresetId = signal<string>('monoreddito-figli');

  readonly preset = computed<HouseholdPreset | undefined>(() =>
    HOUSEHOLD_PRESETS.find(p => p.id === this.selectedPresetId())
  );

  readonly profile = computed<HouseholdProfile | undefined>(() =>
    this.preset()?.profile
  );

  readonly bankingData = computed<BankingData | undefined>(() => {
    const p = this.profile();
    if (!p) return undefined;
    const movimenti = movimentiDaProfile(p);
    return {
      profile: p,
      movimenti,
      spesaPerCategoria: groupByCategoria(movimenti),
      ricorrenti: movimenti.filter(m => m.ricorrente),
    };
  });

  readonly sinkingFund = computed(() => {
    const p = this.profile();
    return p ? computeSinkingFund(p.speseFuture) : { entries: [], totalMonthly: 0 };
  });

  readonly chain = computed(() => {
    const p = this.profile();
    const acc = this.sinkingFund().totalMonthly;
    return p ? computeChain(p, acc) : undefined;
  });

  readonly indicators = computed(() => {
    const p = this.profile();
    return p ? computeIndicators(p) : undefined;
  });

  selectPreset(id: string): void {
    this.selectedPresetId.set(id);
  }
}
