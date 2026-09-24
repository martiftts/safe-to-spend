import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import type { Debito, HouseholdProfile, SpesaFissa } from '@schemas/household';
import { BankingService, EMPTY_PROFILE } from '../../services/banking.service';

const CATEGORIE: SpesaFissa['categoria'][] = [
  'casa', 'trasporti', 'alimentari', 'salute', 'abbonamenti', 'tempo_libero', 'altro',
];

const TIPI_DEBITO: Debito['tipo'][] = [
  'mutuo', 'prestito_personale', 'cessione_quinto', 'finanziamento', 'altro',
];

/**
 * Inserimento del profilo da zero: è il percorso predefinito dell'app.
 * I profili di esempio restano raggiungibili dalla home come scorciatoia.
 */
@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div class="w-full max-w-lg">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">I tuoi dati</h1>
        <p class="text-gray-600 mb-8">
          Servono a calcolare quanto resta davvero. Restano su questo dispositivo.
        </p>

        <!-- Nucleo -->
        <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 class="font-semibold text-gray-900 mb-3">Chi siete in casa</h2>
          <div class="grid grid-cols-3 gap-3">
            <label class="block">
              <span class="text-xs text-gray-500">Adulti</span>
              <input type="number" min="1" [(ngModel)]="adulti" name="adulti" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block">
              <span class="text-xs text-gray-500">Minorenni</span>
              <input type="number" min="0" [(ngModel)]="minori" name="minori" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block">
              <span class="text-xs text-gray-500">Chi porta reddito</span>
              <input type="number" min="1" [(ngModel)]="percettori" name="percettori" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>
        </section>

        <!-- Reddito e saldo -->
        <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 class="font-semibold text-gray-900 mb-3">Quanto entra</h2>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="text-xs text-gray-500">Netto al mese, in tutto</span>
              <input type="number" min="0" [(ngModel)]="nettoMensile" name="netto" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block">
              <span class="text-xs text-gray-500">Mensilità all'anno</span>
              <input type="number" min="12" max="16" [(ngModel)]="mensilita" name="mensilita" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block col-span-2">
              <span class="text-xs text-gray-500">Quanto c'è adesso sul conto</span>
              <input type="number" min="0" [(ngModel)]="saldoAttuale" name="saldo" class="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2" />
            </label>
          </div>
        </section>

        <!-- Spese fisse -->
        <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 class="font-semibold text-gray-900 mb-1">Spese che tornano ogni mese</h2>
          <p class="text-xs text-gray-500 mb-3">Affitto o mutuo, bollette, abbonamenti.</p>

          @for (s of speseFisse(); track $index) {
            <div class="flex items-center justify-between text-sm border-b border-gray-100 py-2">
              <span class="text-gray-700">{{ s.descrizione || s.categoria.replace('_', ' ') }}</span>
              <span class="flex items-center gap-3">
                <span class="tabular-nums text-gray-900 font-medium">{{ s.importo }} €</span>
                <button type="button" (click)="rimuoviSpesa($index)" class="text-gray-400 hover:text-gray-700" aria-label="Rimuovi">×</button>
              </span>
            </div>
          }

          <div class="grid grid-cols-[1fr_auto_auto] gap-2 mt-3">
            <input [(ngModel)]="nuovaDescrizione" name="sfDesc" placeholder="Es. affitto" class="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select [(ngModel)]="nuovaCategoria" name="sfCat" class="rounded-lg border border-gray-300 px-2 py-2 text-sm">
              @for (c of categorie; track c) { <option [value]="c">{{ c.replace('_', ' ') }}</option> }
            </select>
            <input type="number" min="0" [(ngModel)]="nuovoImporto" name="sfImp" placeholder="€" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" (click)="aggiungiSpesa()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Aggiungi</button>
        </section>

        <!-- Debiti -->
        <section class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 class="font-semibold text-gray-900 mb-1">Rate e debiti in corso</h2>
          <p class="text-xs text-gray-500 mb-3">Mutuo, prestiti, finanziamenti. Se non ne hai, salta.</p>

          @for (d of debiti(); track $index) {
            <div class="flex items-center justify-between text-sm border-b border-gray-100 py-2">
              <span class="text-gray-700">{{ d.tipo.replace('_', ' ') }} · ancora {{ d.rateResidue }} rate</span>
              <span class="flex items-center gap-3">
                <span class="tabular-nums text-gray-900 font-medium">{{ d.rata }} €</span>
                <button type="button" (click)="rimuoviDebito($index)" class="text-gray-400 hover:text-gray-700" aria-label="Rimuovi">×</button>
              </span>
            </div>
          }

          <div class="grid grid-cols-[1fr_auto_auto] gap-2 mt-3">
            <select [(ngModel)]="nuovoTipo" name="dbTipo" class="rounded-lg border border-gray-300 px-2 py-2 text-sm">
              @for (t of tipiDebito; track t) { <option [value]="t">{{ t.replace('_', ' ') }}</option> }
            </select>
            <input type="number" min="0" [(ngModel)]="nuovaRata" name="dbRata" placeholder="rata €" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input type="number" min="1" [(ngModel)]="nuoveRateResidue" name="dbRes" placeholder="n. rate" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" (click)="aggiungiDebito()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Aggiungi</button>
        </section>

        @if (!valido()) {
          <p class="text-xs text-gray-400 mb-3">
            Per proseguire servono almeno il netto mensile e il saldo.
          </p>
        }

        <button
          type="button"
          (click)="avanti()"
          [disabled]="!valido()"
          class="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Continua
        </button>

        <button type="button" (click)="ricomincia()" class="w-full mt-3 text-sm text-gray-500 hover:text-gray-800">
          Svuota e ricomincia
        </button>
      </div>
    </div>
  `,
})
export class SetupPage {
  private readonly router: Router = inject(Router);
  private readonly banking: BankingService = inject(BankingService);

  readonly categorie = CATEGORIE;
  readonly tipiDebito = TIPI_DEBITO;

  private readonly base = this.banking.profile() ?? EMPTY_PROFILE;

  adulti = this.base.nucleo.adulti;
  minori = this.base.nucleo.minori;
  percettori = this.base.nucleo.percettori;
  nettoMensile = this.base.reddito.nettoMensile;
  mensilita = this.base.reddito.mensilita;
  saldoAttuale = this.base.saldoAttuale;

  readonly speseFisse = signal<SpesaFissa[]>([...this.base.speseFisse]);
  readonly debiti = signal<Debito[]>([...this.base.debiti]);

  nuovaDescrizione = '';
  nuovaCategoria: SpesaFissa['categoria'] = 'casa';
  nuovoImporto: number | null = null;

  nuovoTipo: Debito['tipo'] = 'mutuo';
  nuovaRata: number | null = null;
  nuoveRateResidue: number | null = null;

  readonly valido = computed(() => this.nettoMensile > 0 && this.saldoAttuale >= 0);

  aggiungiSpesa(): void {
    if (!this.nuovoImporto || this.nuovoImporto <= 0) return;
    this.speseFisse.update(l => [...l, {
      categoria: this.nuovaCategoria,
      importo: this.nuovoImporto as number,
      descrizione: this.nuovaDescrizione || undefined,
    }]);
    this.nuovaDescrizione = '';
    this.nuovoImporto = null;
  }

  rimuoviSpesa(i: number): void {
    this.speseFisse.update(l => l.filter((_, idx) => idx !== i));
  }

  aggiungiDebito(): void {
    if (!this.nuovaRata || this.nuovaRata <= 0) return;
    if (!this.nuoveRateResidue || this.nuoveRateResidue <= 0) return;
    this.debiti.update(l => [...l, {
      tipo: this.nuovoTipo,
      rata: this.nuovaRata as number,
      rateResidue: this.nuoveRateResidue as number,
    }]);
    this.nuovaRata = null;
    this.nuoveRateResidue = null;
  }

  rimuoviDebito(i: number): void {
    this.debiti.update(l => l.filter((_, idx) => idx !== i));
  }

  private componi(): HouseholdProfile {
    return {
      nucleo: { adulti: this.adulti, minori: this.minori, percettori: this.percettori },
      reddito: {
        nettoMensile: this.nettoMensile,
        mensilita: this.mensilita,
        accessoriAnnui: this.base.reddito.accessoriAnnui,
      },
      debiti: this.debiti(),
      speseFisse: this.speseFisse(),
      speseFuture: this.base.speseFuture,
      saldoAttuale: this.saldoAttuale,
    };
  }

  avanti(): void {
    if (!this.valido()) return;
    this.banking.setManualProfile(this.componi());
    this.router.navigate(['/future-expenses']);
  }

  ricomincia(): void {
    this.banking.reset();
    this.router.navigate(['/']);
  }
}
