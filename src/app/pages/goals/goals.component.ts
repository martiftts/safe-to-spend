import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BankingService, type Categoria } from '../../services/banking.service';

export interface Goal {
  cosa: string;
  importo: number;
  mesi: number;
}

export interface Leva {
  categoria: Categoria;
  maxRiduzione: number;
  riduzione: number;
}

const CATEGORIE_LABEL: Record<Categoria, string> = {
  casa: 'Casa',
  trasporti: 'Trasporti',
  alimentari: 'Alimentari',
  salute: 'Salute',
  abbonamenti: 'Abbonamenti',
  tempo_libero: 'Tempo libero',
  altro: 'Altro',
};

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#050008] text-white px-4 py-10">
      <div class="max-w-lg mx-auto">

        <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-6">Safe to Spend · Obiettivo</p>

        <h1 class="text-3xl font-bold mb-2">Cosa vuoi raggiungere?</h1>
        <p class="text-white/45 mb-8 leading-relaxed">
          Imposta importo e scadenza. Poi scegli tu le categorie su cui vuoi agire.
        </p>

        <!-- Obiettivo -->
        <div class="rounded-2xl p-5 mb-5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
          <h2 class="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">Dettagli</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-white/40 mb-1.5">Cosa</label>
              <input
                type="text"
                [(ngModel)]="goal.cosa"
                placeholder="Moto, vacanza, fondo emergenza…"
                class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2"
                style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);focus-ring-color:#A100FF">
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs text-white/40 mb-1.5">Importo (€)</label>
                <input
                  type="number"
                  [(ngModel)]="goal.importo"
                  min="0"
                  placeholder="5000"
                  class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
              </div>
              <div class="flex-1">
                <label class="block text-xs text-white/40 mb-1.5">Entro (mesi)</label>
                <input
                  type="number"
                  [(ngModel)]="goal.mesi"
                  min="1" max="120"
                  placeholder="12"
                  class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12)">
              </div>
            </div>
            @if (goal.importo > 0 && goal.mesi > 0) {
              <div class="rounded-xl p-3 flex justify-between items-center" style="background:rgba(161,0,255,0.08);border:1px solid rgba(161,0,255,0.25)">
                <span class="text-xs text-white/50">Risparmio necessario</span>
                <div class="text-right">
                  <span class="text-lg font-bold text-[#BE82FF]">€ {{ (goal.importo / goal.mesi).toFixed(0) }}/mese</span>
                  @if (chain()) {
                    <span class="ml-2 text-xs font-medium"
                          [style.color]="(chain()!.margine) >= (goal.importo / goal.mesi) ? '#4ade80' : '#FF50A0'">
                      {{ (chain()!.margine) >= (goal.importo / goal.mesi) ? '✓ raggiungibile' : '⚠ serve uno sforzo' }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Leve -->
        @if (banking.bankingData()) {
          <div class="rounded-2xl p-5 mb-5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
            <h2 class="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">Leve di risparmio</h2>
            <p class="text-xs text-white/30 mb-4">Seleziona solo le categorie su cui sei disposto ad agire.</p>
            <div class="space-y-4">
              @for (spesa of banking.bankingData()!.spesaPerCategoria; track spesa.categoria) {
                <div>
                  <div class="flex items-center gap-3 mb-1.5">
                    <button
                      type="button"
                      (click)="toggleLeva(spesa.categoria, spesa.importoMensile)"
                      class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      [style.background]="isLevaAttiva(spesa.categoria) ? '#A100FF' : 'rgba(255,255,255,0.1)'"
                      [style.border]="isLevaAttiva(spesa.categoria) ? '1px solid #A100FF' : '1px solid rgba(255,255,255,0.2)'">
                      @if (isLevaAttiva(spesa.categoria)) {
                        <span class="text-white text-xs leading-none">✓</span>
                      }
                    </button>
                    <div class="flex-1 flex justify-between">
                      <span class="text-sm font-medium text-white/80">{{ categoriaNome(spesa.categoria) }}</span>
                      <span class="text-xs text-white/40">€ {{ spesa.importoMensile.toFixed(0) }}/mese</span>
                    </div>
                  </div>
                  @if (isLevaAttiva(spesa.categoria)) {
                    <div class="ml-8">
                      <input
                        type="range"
                        min="0"
                        [max]="spesa.importoMensile"
                        step="10"
                        [value]="getRiduzione(spesa.categoria)"
                        (input)="setRiduzione(spesa.categoria, +$any($event.target).value)"
                        class="w-full accent-[#A100FF]">
                      <div class="flex justify-between text-xs mt-1">
                        <span class="text-white/25">€ 0</span>
                        <span class="font-semibold" style="color:#FF50A0">- € {{ getRiduzione(spesa.categoria).toFixed(0) }}/mese</span>
                        <span class="text-white/25">€ {{ spesa.importoMensile.toFixed(0) }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- CTA -->
        <button
          type="button"
          [disabled]="!goal.cosa || goal.importo <= 0 || goal.mesi <= 0"
          (click)="vaAlSimulatore()"
          class="w-full font-semibold py-3.5 px-6 rounded-xl transition-all text-white"
          [style.background]="(!goal.cosa || goal.importo <= 0 || goal.mesi <= 0) ? 'rgba(255,255,255,0.1)' : '#A100FF'"
          [style.opacity]="(!goal.cosa || goal.importo <= 0 || goal.mesi <= 0) ? '0.5' : '1'">
          Mostrami come arrivarci →
        </button>
      </div>
    </div>
  `,
})
export class GoalsPage {
  readonly banking: BankingService = inject(BankingService);
  readonly router: Router = inject(Router);
  readonly chain = this.banking.chain;

  goal: Goal = { cosa: '', importo: 0, mesi: 12 };

  // Signal per leve: categorie selezionate + riduzione
  private readonly _leve = signal<Map<Categoria, number>>(new Map());

  isLevaAttiva(cat: Categoria): boolean {
    return this._leve().has(cat);
  }

  getRiduzione(cat: Categoria): number {
    return this._leve().get(cat) ?? 0;
  }

  toggleLeva(cat: Categoria, maxImporto: number): void {
    this._leve.update(m => {
      const next = new Map(m);
      if (next.has(cat)) next.delete(cat);
      else next.set(cat, 0);
      return next;
    });
  }

  setRiduzione(cat: Categoria, val: number): void {
    this._leve.update(m => {
      const next = new Map(m);
      next.set(cat, val);
      return next;
    });
  }

  categoriaNome(cat: Categoria): string {
    return CATEGORIE_LABEL[cat];
  }

  leve = computed((): Array<{ categoria: Categoria; riduzione: number }> =>
    Array.from(this._leve().entries()).map(([categoria, riduzione]) => ({ categoria, riduzione }))
  );

  vaAlSimulatore(): void {
    // Salva stato goal + leve nel service (workaround: navigation extras)
    this.router.navigate(['/simulator'], {
      state: { goal: this.goal, leve: this.leve() },
    });
  }
}
