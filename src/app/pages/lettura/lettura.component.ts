import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BankingService } from '../../services/banking.service';

/**
 * Cosa la banca ha letto dal conto.
 *
 * Non è un form: l'app vive dentro l'home banking e i dati economici li ha
 * già. Questa schermata li mostra, e serve a far capire che l'unica cosa
 * ancora da chiedere riguarda il futuro.
 */
@Component({
  selector: 'app-lettura',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div class="w-full max-w-lg">

        @if (!banking.hasProfile()) {
          <div class="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <p class="text-gray-600 mb-4">Non c'è ancora nessun conto collegato.</p>
            <button type="button" (click)="ricomincia()"
                    class="bg-gray-900 text-white font-semibold py-2.5 px-5 rounded-xl">Torna all'inizio</button>
          </div>
        } @else {
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Ecco cosa ho letto</h1>
          <p class="text-gray-600 mb-8">
            Dai movimenti degli ultimi mesi. Non devi inserire nulla.
          </p>

          <!-- Entrate -->
          <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Entrate</h2>
            <div class="flex items-baseline justify-between">
              <span class="text-gray-700">Netto mensile</span>
              <span class="text-xl font-bold text-gray-900 tabular-nums">{{ profile()!.reddito.nettoMensile }} €</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              su {{ profile()!.reddito.mensilita }} mensilità · saldo attuale
              <span class="tabular-nums">{{ profile()!.saldoAttuale }} €</span>
            </p>
          </section>

          <!-- Rate e debiti -->
          @if (profile()!.debiti.length) {
            <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h2 class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Rate e debiti</h2>
              @for (d of profile()!.debiti; track $index) {
                <div class="flex items-baseline justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span class="text-gray-700 capitalize">{{ d.tipo.replace('_', ' ') }}</span>
                  <span class="text-right">
                    <span class="font-medium text-gray-900 tabular-nums">{{ d.rata }} €</span>
                    <span class="block text-xs text-gray-400">ancora {{ d.rateResidue }} rate</span>
                  </span>
                </div>
              }
              <div class="flex items-baseline justify-between pt-3 mt-2 border-t border-gray-200">
                <span class="text-sm text-gray-500">Totale al mese</span>
                <span class="font-bold text-gray-900 tabular-nums">{{ totaleRate() }} €</span>
              </div>
            </section>
          }

          <!-- Spese per categoria -->
          <section class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 class="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Uscite per tipologia</h2>
            @for (s of categorie(); track s.categoria) {
              <div class="flex items-center gap-3 py-1.5">
                <span class="text-sm text-gray-700 w-28 shrink-0 capitalize">{{ s.categoria.replace('_', ' ') }}</span>
                <span class="h-2 rounded-full bg-violet-500/70" [style.width.%]="larghezza(s.importoMensile)"></span>
                <span class="ml-auto text-sm text-gray-600 tabular-nums">{{ s.importoMensile }} €</span>
              </div>
            }
          </section>

          <!-- Ricorrenze -->
          @if (ricorrenti().length) {
            <section class="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-8">
              <p class="text-sm text-violet-900">
                Ho trovato <strong>{{ ricorrenti().length }} addebiti che tornano ogni mese</strong>,
                per <span class="tabular-nums font-semibold">{{ totaleRicorrenti() }} €</span>.
              </p>
            </section>
          }

          <button type="button" (click)="avanti()"
                  class="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
            Continua
          </button>
          <p class="text-xs text-gray-400 text-center mt-3">
            Manca una cosa sola: le spese che hai già in programma.
          </p>
        }
      </div>
    </div>
  `,
})
export class LetturaPage {
  private readonly router: Router = inject(Router);
  readonly banking: BankingService = inject(BankingService);

  readonly profile = this.banking.profile;

  readonly categorie = computed(() => this.banking.bankingData()?.spesaPerCategoria ?? []);
  readonly ricorrenti = computed(() => this.banking.bankingData()?.ricorrenti ?? []);

  readonly totaleRate = computed(() =>
    (this.profile()?.debiti ?? []).reduce((s, d) => s + d.rata, 0)
  );

  readonly totaleRicorrenti = computed(() =>
    this.ricorrenti().reduce((s, m) => s + m.importoMensile, 0)
  );

  private readonly massimo = computed(() =>
    Math.max(1, ...this.categorie().map(c => c.importoMensile))
  );

  larghezza(importo: number): number {
    return Math.max(4, Math.round((importo / this.massimo()) * 60));
  }

  avanti(): void {
    this.router.navigate(['/future-expenses']);
  }

  ricomincia(): void {
    this.banking.reset();
    this.router.navigate(['/']);
  }
}
