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

/** Cliente predefinito quando si entra dal flusso principale. */
export const DEFAULT_CUSTOMER_ID = 'monoreddito-figli';

/**
 * Come si è arrivati al cruscotto.
 *  flusso       → consenso, lettura dei dati, spese future
 *  scorciatoia  → profilo aperto direttamente dalla home
 */
export type EntryMode = 'flusso' | 'scorciatoia';

@Injectable({ providedIn: 'root' })
export class BankingService {
  /**
   * I dati economici arrivano dal conto: l'app vive dentro l'home banking e non
   * li chiede all'utente. Il preset rappresenta il cliente di cui la banca
   * possiede i dati.
   */
  readonly customerId = signal<string | null>(null);
  readonly entryMode = signal<EntryMode>('flusso');

  /**
   * L'unica cosa che il conto non può sapere: le spese che la persona ha già in
   * programma. È l'unico dato che l'utente inserisce.
   */
  readonly speseFutureUtente = signal<HouseholdProfile['speseFuture'] | null>(null);

  readonly preset = computed<HouseholdPreset | undefined>(() => {
    const id = this.customerId();
    return id ? HOUSEHOLD_PRESETS.find(p => p.id === id) : undefined;
  });

  readonly profile = computed<HouseholdProfile | undefined>(() => {
    const base = this.preset()?.profile;
    if (!base) return undefined;
    const override = this.speseFutureUtente();
    return override ? { ...base, speseFuture: override } : base;
  });

  /** Vero quando c'è un profilo su cui il cruscotto può lavorare. */
  readonly hasProfile = computed(() => this.profile() !== undefined);

  /** Avvia il percorso completo: consenso, lettura dei dati, spese future. */
  startFlow(customerId: string = DEFAULT_CUSTOMER_ID): void {
    this.customerId.set(customerId);
    this.speseFutureUtente.set(null);
    this.entryMode.set('flusso');
  }

  /** Apre un profilo direttamente dalla home, saltando il percorso. */
  openShortcut(customerId: string): void {
    this.customerId.set(customerId);
    this.speseFutureUtente.set(null);
    this.entryMode.set('scorciatoia');
  }

  /** Registra le spese future inserite dall'utente. */
  setSpeseFuture(speseFuture: HouseholdProfile['speseFuture']): void {
    this.speseFutureUtente.set(speseFuture);
  }

  /** Svuota tutto e riporta all'ingresso, senza ricaricare la pagina. */
  reset(): void {
    this.customerId.set(null);
    this.speseFutureUtente.set(null);
    this.entryMode.set('flusso');
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
