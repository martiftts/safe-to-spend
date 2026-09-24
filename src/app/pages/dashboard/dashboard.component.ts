import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BankingService } from '../../services/banking.service';
import { HOUSEHOLD_PRESETS } from '../../data/household-profiles';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-10">
      <div class="max-w-lg mx-auto">

        <!-- Selettore profilo -->
        <div class="mb-6">
          <label class="block text-sm text-gray-500 mb-2">Profilo di demo</label>
          <div class="flex flex-wrap gap-2">
            @for (p of presets; track p.id) {
              <button
                type="button"
                (click)="banking.selectPreset(p.id)"
                class="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                [class.bg-blue-600]="banking.selectedPresetId() === p.id"
                [class.text-white]="banking.selectedPresetId() === p.id"
                [class.border-blue-600]="banking.selectedPresetId() === p.id"
                [class.bg-white]="banking.selectedPresetId() !== p.id"
                [class.text-gray-700]="banking.selectedPresetId() !== p.id"
                [class.border-gray-300]="banking.selectedPresetId() !== p.id">
                {{ p.label }}
              </button>
            }
          </div>
        </div>

        <!-- Budget giornaliero -->
        @if (chain()) {
          <div class="rounded-2xl p-6 mb-6 text-white"
               [class.bg-green-600]="chain()!.margine >= 0"
               [class.bg-red-600]="chain()!.margine < 0">
            <p class="text-sm opacity-80 mb-1">Budget giornaliero disponibile</p>
            <p class="text-4xl font-bold">
              € {{ chain()!.budgetGiornaliero.toFixed(0) }}
              <span class="text-lg font-normal opacity-80">/giorno</span>
            </p>
            <p class="text-sm opacity-80 mt-1">
              Margine mensile: € {{ chain()!.margine.toFixed(0) }}
            </p>
          </div>

          <!-- Catena a scalini -->
          <div class="bg-white rounded-xl border border-gray-200 mb-6">
            <div class="px-4 py-3 border-b border-gray-100">
              <h2 class="font-semibold text-gray-900">Come l'abbiamo calcolato</h2>
            </div>
            @for (step of chain()!.steps; track step.label; let i = $index) {
              <div class="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  (click)="toggleStep(i)"
                  class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <span class="text-sm font-medium text-gray-800">{{ step.label }}</span>
                  <div class="flex items-center gap-3">
                    <span
                      class="text-sm font-semibold"
                      [class.text-red-600]="step.amount < 0"
                      [class.text-green-600]="step.amount >= 0">
                      {{ step.amount >= 0 ? '+' : '' }}€ {{ step.amount.toFixed(0) }}
                    </span>
                    <span class="text-gray-400 text-xs">{{ expandedSteps().has(i) ? '▲' : '▼' }}</span>
                  </div>
                </button>
                @if (expandedSteps().has(i)) {
                  <div class="px-4 pb-3 bg-gray-50">
                    <p class="text-xs text-gray-500 mb-1">Totale progressivo:</p>
                    <p class="text-sm font-bold" [class.text-red-700]="step.running < 0" [class.text-gray-900]="step.running >= 0">
                      € {{ step.running.toFixed(2) }}
                    </p>
                    <p class="text-xs text-gray-400 mt-1 font-mono">{{ step.formula }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Indicatori -->
          @if (indicators()) {
            <div class="bg-white rounded-xl border border-gray-200 mb-6">
              <div class="px-4 py-3 border-b border-gray-100">
                <h2 class="font-semibold text-gray-900">Indicatori di approfondimento</h2>
              </div>
              <div class="divide-y divide-gray-100">
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-600">Reddito equivalente OCSE</span>
                  <span class="text-sm font-semibold text-gray-900">
                    € {{ indicators()!.oecd.redditoEquivalente.toFixed(0) }}/mese
                    <span class="text-gray-400 font-normal">(x{{ indicators()!.oecd.coefficiente.toFixed(1) }})</span>
                  </span>
                </div>
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-600">Quota impegnata in rate</span>
                  <span class="text-sm font-semibold"
                        [class.text-red-600]="indicators()!.debito.quotaImpegnata > 0.33"
                        [class.text-gray-900]="indicators()!.debito.quotaImpegnata <= 0.33">
                    {{ (indicators()!.debito.quotaImpegnata * 100).toFixed(0) }}%
                  </span>
                </div>
                @if (indicators()!.debito.liberazioneMesi > 0) {
                  <div class="px-4 py-3 flex justify-between">
                    <span class="text-sm text-gray-600">Liberazione dalle rate tra</span>
                    <span class="text-sm font-semibold text-gray-900">
                      {{ indicators()!.debito.liberazioneMesi }} mesi
                    </span>
                  </div>
                }
                <div class="px-4 py-3 flex justify-between">
                  <span class="text-sm text-gray-600">Saldo reale (al netto degli impegni)</span>
                  <span class="text-sm font-semibold"
                        [class.text-red-600]="indicators()!.bilancio.saldoReale < 0"
                        [class.text-gray-900]="indicators()!.bilancio.saldoReale >= 0">
                    € {{ indicators()!.bilancio.saldoReale.toFixed(0) }}
                  </span>
                </div>
              </div>
            </div>
          }
        }

        <!-- CTA -->
        <button
          type="button"
          (click)="router.navigate(['/goals'])"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          Imposta un obiettivo
        </button>
      </div>
    </div>
  `,
})
export class DashboardPage {
  readonly banking: BankingService = inject(BankingService);
  readonly router: Router = inject(Router);

  readonly presets = HOUSEHOLD_PRESETS;
  readonly chain = this.banking.chain;
  readonly indicators = this.banking.indicators;

  readonly expandedSteps = signal<Set<number>>(new Set());

  toggleStep(i: number): void {
    this.expandedSteps.update(s => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
}
