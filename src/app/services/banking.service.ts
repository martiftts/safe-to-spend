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

/** Da dove arriva il profilo attualmente in uso. */
export type ProfileSource = 'manuale' | 'preset';

/** Punto di partenza dell'inserimento da zero. */
export const EMPTY_PROFILE: HouseholdProfile = {
  nucleo: { adulti: 1, minori: 0, percettori: 1 },
  reddito: { nettoMensile: 0, mensilita: 12, accessoriAnnui: 0 },
  debiti: [],
  speseFisse: [],
  speseFuture: [],
  saldoAttuale: 0,
};

@Injectable({ providedIn: 'root' })
export class BankingService {
  /**
   * Il percorso predefinito è l'inserimento dei propri dati. I preset restano
   * come scorciatoia dichiarata dalla home, per vedere risultati calcolati
   * senza compilare tutto a mano.
   */
  readonly source = signal<ProfileSource>('manuale');
  readonly selectedPresetId = signal<string | null>(null);
  readonly manualProfile = signal<HouseholdProfile | null>(null);

  readonly preset = computed<HouseholdPreset | undefined>(() => {
    const id = this.selectedPresetId();
    return id ? HOUSEHOLD_PRESETS.find(p => p.id === id) : undefined;
  });

  readonly profile = computed<HouseholdProfile | undefined>(() =>
    this.source() === 'preset' ? this.preset()?.profile : this.manualProfile() ?? undefined
  );

  /** Vero quando c'è un profilo su cui il cruscotto può lavorare. */
  readonly hasProfile = computed(() => this.profile() !== undefined);

  /** Carica un profilo di esempio e salta l'inserimento. */
  loadPreset(id: string): void {
    this.selectedPresetId.set(id);
    this.source.set('preset');
  }

  /** Inizia un inserimento da zero. */
  startManual(): void {
    this.manualProfile.set({ ...EMPTY_PROFILE });
    this.selectedPresetId.set(null);
    this.source.set('manuale');
  }

  /**
   * Scrive il profilo inserito a mano. Se si stava guardando un preset,
   * il valore diventa il punto di partenza invece di essere perso.
   */
  setManualProfile(p: HouseholdProfile): void {
    this.manualProfile.set(p);
    this.selectedPresetId.set(null);
    this.source.set('manuale');
  }

  /** Aggiorna le sole spese future, da qualunque origine venga il profilo. */
  setSpeseFuture(speseFuture: HouseholdProfile['speseFuture']): void {
    const base = this.profile();
    if (!base) return;
    this.setManualProfile({ ...base, speseFuture });
  }

  /** Svuota tutto e riporta all'ingresso, senza ricaricare la pagina. */
  reset(): void {
    this.manualProfile.set(null);
    this.selectedPresetId.set(null);
    this.source.set('manuale');
  }

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
}
