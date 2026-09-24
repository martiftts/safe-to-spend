import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BankingService } from '../../services/banking.service';
import { computeSinkingFund } from '../../engine/sinking-fund';
import type { SpesaFutura } from '@schemas/household';

@Component({
  selector: 'app-future-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-10">
      <div class="max-w-lg mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Spese future previste</h1>
        <p class="text-gray-600 mb-8">
          Aggiungi le spese che già conosci. Quei soldi sono già impegnati anche se sono ancora sul conto.
        </p>

        <!-- Lista spese future -->
        @if (speseFuture().length > 0) {
          <div class="space-y-3 mb-6">
            @for (sf of speseFuture(); track sf.descrizione; let i = $index) {
              <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ sf.descrizione }}</p>
                  <p class="text-sm text-gray-500">
                    € {{ sf.importo.toFixed(0) }} · tra {{ sf.mesiMancanti }} mesi ·
                    <span class="text-blue-600 font-medium">€ {{ (sf.importo / sf.mesiMancanti).toFixed(0) }}/mese</span>
                  </p>
                </div>
                <button
                  type="button"
                  (click)="rimuovi(i)"
                  class="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none"
                  aria-label="Rimuovi">×</button>
              </div>
            }
          </div>
        }

        <!-- Sinking fund totale -->
        @if (sinkingFund().totalMonthly > 0) {
          <div class="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <p class="text-sm text-blue-700 font-medium">Accantonamento mensile totale</p>
            <p class="text-2xl font-bold text-blue-900">€ {{ sinkingFund().totalMonthly.toFixed(0) }}/mese</p>
            <p class="text-xs text-blue-600 mt-1">
              Questa quota viene sottratta dal margine disponibile — è già impegnata.
            </p>
          </div>
        }

        <!-- Form nuova spesa -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 class="font-semibold text-gray-900 mb-4">Aggiungi una spesa</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Cosa</label>
              <input
                type="text"
                [(ngModel)]="nuovaDescrizione"
                placeholder="es. Vacanza, auto, dentista"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-sm text-gray-600 mb-1">Importo (€)</label>
                <input
                  type="number"
                  [(ngModel)]="nuovoImporto"
                  min="1"
                  placeholder="1500"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="flex-1">
                <label class="block text-sm text-gray-600 mb-1">Tra quanti mesi</label>
                <input
                  type="number"
                  [(ngModel)]="nuoviMesi"
                  min="1"
                  max="120"
                  placeholder="6"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            @if (nuovaDescrizione && nuovoImporto > 0 && nuoviMesi > 0) {
              <p class="text-sm text-blue-600">
                → accantonamento: € {{ (nuovoImporto / nuoviMesi).toFixed(0) }}/mese
              </p>
            }
            <button
              type="button"
              (click)="aggiungi()"
              [disabled]="!nuovaDescrizione || nuovoImporto <= 0 || nuoviMesi <= 0"
              class="w-full bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors">
              Aggiungi
            </button>
          </div>
        </div>

        <button
          type="button"
          (click)="avanti()"
          class="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Vai al cruscotto
        </button>
      </div>
    </div>
  `,
})
export class FutureExpensesPage {
  private readonly router: Router = inject(Router);
  private readonly banking: BankingService = inject(BankingService);

  speseFuture = signal<SpesaFutura[]>(
    this.banking.profile()?.speseFuture ?? []
  );

  sinkingFund = computed(() => computeSinkingFund(this.speseFuture()));

  nuovaDescrizione = '';
  nuovoImporto = 0;
  nuoviMesi = 0;

  aggiungi(): void {
    if (!this.nuovaDescrizione || this.nuovoImporto <= 0 || this.nuoviMesi <= 0) return;
    this.speseFuture.update(list => [
      ...list,
      { descrizione: this.nuovaDescrizione, importo: this.nuovoImporto, mesiMancanti: this.nuoviMesi },
    ]);
    this.nuovaDescrizione = '';
    this.nuovoImporto = 0;
    this.nuoviMesi = 0;
  }

  rimuovi(i: number): void {
    this.speseFuture.update(list => list.filter((_, idx) => idx !== i));
  }

  avanti(): void {
    // Le spese inserite qui devono finire nel profilo: senza questo passaggio
    // il cruscotto ricalcolerebbe l'accantonamento sui dati di partenza.
    this.banking.setSpeseFuture(this.speseFuture());
    this.router.navigate(['/dashboard']);
  }
}
