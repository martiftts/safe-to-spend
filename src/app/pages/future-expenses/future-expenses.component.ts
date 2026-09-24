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
    <div class="min-h-screen bg-[#050008] text-white px-4 py-10">
      <div class="max-w-lg mx-auto">

        <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-6">Safe to Spend · Spese pianificate</p>
        <h1 class="text-3xl font-bold mb-2">Cosa sai già che spenderai?</h1>
        <p class="text-white/45 mb-8 leading-relaxed">
          Quei soldi sono già impegnati, anche se sono ancora sul conto.
        </p>

        <!-- Lista spese future -->
        @if (speseFuture().length > 0) {
          <div class="space-y-2 mb-5">
            @for (sf of speseFuture(); track sf.descrizione; let i = $index) {
              <div class="rounded-2xl p-4 flex items-center justify-between"
                   style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
                <div>
                  <p class="font-medium text-white">{{ sf.descrizione }}</p>
                  <p class="text-xs text-white/40 mt-0.5">
                    € {{ sf.importo.toFixed(0) }} · tra {{ sf.mesiMancanti }} mesi ·
                    <span class="font-semibold" style="color:#BE82FF">€ {{ (sf.importo / sf.mesiMancanti).toFixed(0) }}/mese</span>
                  </p>
                </div>
                <button
                  type="button"
                  (click)="rimuovi(i)"
                  class="text-white/25 hover:text-[#FF50A0] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
                  aria-label="Rimuovi">×</button>
              </div>
            }
          </div>
        }

        <!-- Sinking fund totale -->
        @if (sinkingFund().totalMonthly > 0) {
          <div class="rounded-2xl p-4 mb-5 flex justify-between items-center"
               style="background:rgba(161,0,255,0.08);border:1px solid rgba(161,0,255,0.25)">
            <div>
              <p class="text-xs text-[#BE82FF] uppercase tracking-widest mb-0.5">Accantonamento totale</p>
              <p class="text-2xl font-bold text-white">€ {{ sinkingFund().totalMonthly.toFixed(0) }}<span class="text-base font-normal text-white/40">/mese</span></p>
            </div>
            <span class="text-2xl">🏦</span>
          </div>
        }

        <!-- Form nuova spesa -->
        <div class="rounded-2xl p-5 mb-5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">Aggiungi una voce</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-white/40 mb-1.5">Cosa</label>
              <input
                type="text"
                [(ngModel)]="nuovaDescrizione"
                placeholder="Vacanza, auto, dentista…"
                class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs text-white/40 mb-1.5">Importo (€)</label>
                <input
                  type="number"
                  [(ngModel)]="nuovoImporto"
                  min="1" placeholder="1500"
                  class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
              </div>
              <div class="flex-1">
                <label class="block text-xs text-white/40 mb-1.5">Tra quanti mesi</label>
                <input
                  type="number"
                  [(ngModel)]="nuoviMesi"
                  min="1" max="120" placeholder="6"
                  class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
              </div>
            </div>
            @if (nuovaDescrizione && nuovoImporto > 0 && nuoviMesi > 0) {
              <p class="text-sm font-medium" style="color:#BE82FF">
                → accantonamento: € {{ (nuovoImporto / nuoviMesi).toFixed(0) }}/mese
              </p>
            }
            <button
              type="button"
              (click)="aggiungi()"
              [disabled]="!nuovaDescrizione || nuovoImporto <= 0 || nuoviMesi <= 0"
              class="w-full text-white font-medium py-2.5 rounded-xl transition-all"
              [style.background]="(!nuovaDescrizione || nuovoImporto <= 0 || nuoviMesi <= 0) ? 'rgba(255,255,255,0.08)' : 'rgba(161,0,255,0.6)'"
              [style.opacity]="(!nuovaDescrizione || nuovoImporto <= 0 || nuoviMesi <= 0) ? '0.5' : '1'">
              + Aggiungi
            </button>
          </div>
        </div>

        <button
          type="button"
          (click)="avanti()"
          class="w-full bg-[#A100FF] hover:bg-[#8800d9] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all">
          Vai al cruscotto →
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
    this.router.navigate(['/dashboard']);
  }
}
