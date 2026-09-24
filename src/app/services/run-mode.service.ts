import { Injectable, computed, signal } from '@angular/core';

/**
 * Modalità di esecuzione del workflow.
 *
 *  live   → i tre step chiamano l'API
 *  local  → i tre step usano i percorsi deterministici, senza rete
 *
 * La modalità locale non è un ripiego: è l'unica configurazione in cui il
 * sistema è interamente ispezionabile e riproducibile, e in demo permette di
 * mostrare la degradazione controllata invece di doverla raccontare.
 * Vedi agents/policies/escalation.md.
 */
export type RunMode = 'live' | 'local';

const STORAGE_KEY = 'sts.apiKey';
const STORAGE_MODE = 'sts.mode';

/** sessionStorage e non localStorage: la chiave non sopravvive alla chiusura del browser. */
function read(key: string): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(key) ?? '';
}

function write(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  if (value) sessionStorage.setItem(key, value);
  else sessionStorage.removeItem(key);
}

@Injectable({ providedIn: 'root' })
export class RunModeService {
  private readonly _apiKey = signal(read(STORAGE_KEY));
  private readonly _requested = signal<RunMode>(read(STORAGE_MODE) === 'live' ? 'live' : 'local');

  readonly apiKey = this._apiKey.asReadonly();
  readonly requestedMode = this._requested.asReadonly();

  /** Senza chiave non si va in live, qualunque cosa sia stata richiesta. */
  readonly mode = computed<RunMode>(() =>
    this._requested() === 'live' && this._apiKey().length > 0 ? 'live' : 'local',
  );

  readonly canGoLive = computed(() => this._apiKey().length > 0);

  /**
   * L'utente ha chiesto live ma manca la chiave: la UI deve dirglielo invece
   * di far finta che l'interruttore non abbia avuto effetto.
   */
  readonly liveUnavailable = computed(() => this._requested() === 'live' && !this.canGoLive());

  setApiKey(key: string): void {
    const trimmed = key.trim();
    this._apiKey.set(trimmed);
    write(STORAGE_KEY, trimmed);
  }

  clearApiKey(): void {
    this.setApiKey('');
    this.setMode('local');
  }

  setMode(mode: RunMode): void {
    this._requested.set(mode);
    write(STORAGE_MODE, mode);
  }
}
