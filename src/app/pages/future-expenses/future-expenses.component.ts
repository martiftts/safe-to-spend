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
    <div class="page">
      <div class="page-inner">

        <p class="eyebrow mb-6">Safe to Spend · Spese pianificate</p>
        <h1 class="text-3xl font-bold mb-2">Cosa sai già che spenderai?</h1>
        <p class="text-muted mb-8 leading-relaxed">
          Quei soldi sono già impegnati, anche se sono ancora sul conto.
        </p>

        <!-- Lista spese future -->
        @if (speseFuture().length > 0) {
          <div class="space-y-2 mb-5">
            @for (sf of speseFuture(); track sf.descrizione; let i = $index) {
              <div class="card-dark p-4 flex items-center justify-between">
                <div>
                  <p class="font-medium text-white">{{ sf.descrizione }}</p>
                  <p class="text-xs text-faint mt-0.5">
                    € {{ sf.importo.toFixed(0) }} · tra {{ sf.mesiMancanti }} mesi ·
                    <span class="font-semibold" style="color:var(--brand-light)">€ {{ (sf.importo / sf.mesiMancanti).toFixed(0) }}/mese</span>
                  </p>
                </div>
                <button type="button" (click)="rimuovi(i)"
                        class="text-faint hover:text-[#FF50A0] active:scale-[0.85] transition-all
                               text-2xl leading-none w-8 h-8 flex items-center justify-center"
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
              <p class="eyebrow mb-0.5" style="font-size:10px">Accantonamento totale</p>
              <p class="text-2xl font-bold text-white">
                € {{ sinkingFund().totalMonthly.toFixed(0) }}<span class="text-base font-normal text-muted">/mese</span>
              </p>
            </div>
            <span class="text-2xl">🏦</span>
          </div>
        }

        <!-- Form nuova spesa -->
        <div class="card-dark p-5 mb-5">
          <h2 class="card-section-label mb-4">Aggiungi una voce</h2>
          <div class="space-y-3">
            <div>
              <label class="label-dark">Cosa</label>
              <input type="text" [(ngModel)]="nuovaDescrizione"
                     placeholder="Vacanza, auto, dentista…" class="input-dark">
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="label-dark">Importo (€)</label>
                <input type="number" [(ngModel)]="nuovoImporto" min="1" placeholder="1500" class="input-dark">
              </div>
              <div class="flex-1">
                <label class="label-dark">Tra quanti mesi</label>
                <input type="number" [(ngModel)]="nuoviMesi" min="1" max="120" placeholder="6" class="input-dark">
              </div>
            </div>
            @if (nuovaDescrizione && nuovoImporto > 0 && nuoviMesi > 0) {
              <p class="text-sm font-medium" style="color:var(--brand-light)">
                → accantonamento: € {{ (nuovoImporto / nuoviMesi).toFixed(0) }}/mese
              </p>
            }
            <button type="button" (click)="aggiungi()"
                    [disabled]="!nuovaDescrizione || nuovoImporto <= 0 || nuoviMesi <= 0"
                    class="btn-primary">
              + Aggiungi
            </button>
          </div>
        </div>

        <button type="button" (click)="avanti()" class="btn-primary">
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
    // Le spese inserite qui devono finire nel profilo: senza questo passaggio
    // il cruscotto ricalcolerebbe l'accantonamento sui dati di partenza.
    this.banking.setSpeseFuture(this.speseFuture());
    this.router.navigate(['/dashboard']);
  }
}
