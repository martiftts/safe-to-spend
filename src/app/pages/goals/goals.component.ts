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
    <div class="min-h-screen bg-gray-50 px-4 py-10">
      <div class="max-w-lg mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Obiettivo</h1>
        <p class="text-gray-600 mb-8">
          Imposta cosa vuoi comprare, quanto costa e quando. Poi scegli tu quali categorie
          puoi ridurre — nessuna è comprimibile per default.
        </p>

        <!-- Obiettivo -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <h2 class="font-semibold text-gray-900 mb-4">Cosa vuoi raggiungere?</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Cosa</label>
              <input
                type="text"
                [(ngModel)]="goal.cosa"
                placeholder="es. Moto, vacanza, fondo emergenza"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-sm text-gray-600 mb-1">Quanto costa (€)</label>
                <input
                  type="number"
                  [(ngModel)]="goal.importo"
                  min="0"
                  placeholder="5000"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="flex-1">
                <label class="block text-sm text-gray-600 mb-1">Entro (mesi)</label>
                <input
                  type="number"
                  [(ngModel)]="goal.mesi"
                  min="1"
                  max="120"
                  placeholder="12"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            @if (goal.importo > 0 && goal.mesi > 0) {
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-sm text-gray-600">
                  Risparmio necessario:
                  <span class="font-bold text-gray-900">
                    € {{ (goal.importo / goal.mesi).toFixed(0) }}/mese
                  </span>
                </p>
                <p class="text-sm text-gray-500 mt-0.5">
                  Margine attuale: € {{ chain()?.margine?.toFixed(0) ?? '—' }}/mese
                  @if (chain() && goal.importo > 0 && goal.mesi > 0) {
                    <span [class.text-red-600]="(chain()!.margine) < (goal.importo / goal.mesi)"
                          [class.text-green-600]="(chain()!.margine) >= (goal.importo / goal.mesi)">
                      · {{ (chain()!.margine) >= (goal.importo / goal.mesi) ? 'raggiungibile' : 'serve uno sforzo' }}
                    </span>
                  }
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Leve (categorie comprimibili) -->
        @if (banking.bankingData()) {
          <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h2 class="font-semibold text-gray-900 mb-1">Quali categorie puoi ridurre?</h2>
            <p class="text-xs text-gray-500 mb-4">Marca solo quelle che sei disposto a considerare. Nessuna è selezionata per default.</p>
            <div class="space-y-4">
              @for (spesa of banking.bankingData()!.spesaPerCategoria; track spesa.categoria) {
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <input
                      type="checkbox"
                      [id]="'leva-' + spesa.categoria"
                      [checked]="isLevaAttiva(spesa.categoria)"
                      (change)="toggleLeva(spesa.categoria, spesa.importoMensile)"
                      class="w-4 h-4 text-blue-600 rounded">
                    <label [for]="'leva-' + spesa.categoria" class="flex-1 flex justify-between text-sm">
                      <span class="font-medium text-gray-800">{{ categoriaNome(spesa.categoria) }}</span>
                      <span class="text-gray-500">€ {{ spesa.importoMensile.toFixed(0) }}/mese</span>
                    </label>
                  </div>
                  @if (isLevaAttiva(spesa.categoria)) {
                    <div class="ml-7">
                      <input
                        type="range"
                        min="0"
                        [max]="spesa.importoMensile"
                        step="10"
                        [value]="getRiduzione(spesa.categoria)"
                        (input)="setRiduzione(spesa.categoria, +$any($event.target).value)"
                        class="w-full accent-blue-600">
                      <div class="flex justify-between text-xs text-gray-500 mt-0.5">
                        <span>€ 0</span>
                        <span class="text-blue-600 font-medium">
                          - € {{ getRiduzione(spesa.categoria).toFixed(0) }}/mese
                        </span>
                        <span>€ {{ spesa.importoMensile.toFixed(0) }}</span>
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
          class="w-full bg-blue-600 disabled:bg-gray-300 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Mostrami come arrivarci
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
