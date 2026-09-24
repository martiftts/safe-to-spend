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
    <div class="min-h-screen bg-[#050008] text-white px-4 py-10">
      <div class="max-w-lg mx-auto">

        <!-- Header -->
        <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-6">
          Safe to Spend · Cruscotto
        </p>

        <!-- Selettore profilo -->
        <div class="mb-6">
          <p class="text-xs text-white/40 mb-3 uppercase tracking-widest">Profilo di demo</p>
          <div class="flex flex-wrap gap-2">
            @for (p of presets; track p.id) {
              <button
                type="button"
                (click)="banking.selectPreset(p.id)"
                class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                [style.background]="banking.selectedPresetId() === p.id ? '#A100FF' : 'rgba(255,255,255,0.05)'"
                [style.border-color]="banking.selectedPresetId() === p.id ? '#A100FF' : 'rgba(255,255,255,0.15)'"
                [style.color]="banking.selectedPresetId() === p.id ? '#fff' : 'rgba(255,255,255,0.6)'">
                {{ p.label }}
              </button>
            }
          </div>
        </div>

        <!-- Budget giornaliero -->
        @if (chain()) {
          <div class="rounded-2xl p-6 mb-5"
               [style.background]="chain()!.margine >= 0 ? 'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.05))' : 'linear-gradient(135deg,rgba(255,80,160,0.15),rgba(255,80,160,0.05))'"
               [style.border]="chain()!.margine >= 0 ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,80,160,0.3)'">
            <p class="text-xs uppercase tracking-widest mb-2"
               [style.color]="chain()!.margine >= 0 ? '#4ade80' : '#FF50A0'">
              Budget giornaliero disponibile
            </p>
            <p class="text-5xl font-bold tracking-tight"
               [style.color]="chain()!.margine >= 0 ? '#4ade80' : '#FF50A0'">
              € {{ chain()!.budgetGiornaliero.toFixed(0) }}
              <span class="text-xl font-normal opacity-60">/g</span>
            </p>
            <p class="text-sm mt-2" style="color:rgba(255,255,255,0.5)">
              Margine mensile: <strong style="color:inherit">€ {{ chain()!.margine.toFixed(0) }}</strong>
            </p>
          </div>

          <!-- Catena a scalini -->
          <div class="rounded-2xl mb-5 overflow-hidden"
               style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
            <div class="px-5 py-4" style="border-bottom:1px solid rgba(255,255,255,0.08)">
              <h2 class="text-sm font-semibold text-white/80 uppercase tracking-widest">Come l'abbiamo calcolato</h2>
            </div>
            @for (step of chain()!.steps; track step.label; let i = $index) {
              <div style="border-bottom:1px solid rgba(255,255,255,0.06)" class="last:border-0">
                <button
                  type="button"
                  (click)="toggleStep(i)"
                  class="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-white/5">
                  <span class="text-sm text-white/70">{{ step.label }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold"
                          [style.color]="step.amount < 0 ? '#FF50A0' : '#4ade80'">
                      {{ step.amount >= 0 ? '+' : '' }}€ {{ step.amount.toFixed(0) }}
                    </span>
                    <span class="text-white/25 text-xs">{{ expandedSteps().has(i) ? '▲' : '▼' }}</span>
                  </div>
                </button>
                @if (expandedSteps().has(i)) {
                  <div class="px-5 pb-4" style="background:rgba(255,255,255,0.03)">
                    <p class="text-xs text-white/40 mb-1">Progressivo:</p>
                    <p class="text-sm font-bold"
                       [style.color]="step.running < 0 ? '#FF50A0' : '#fff'">
                      € {{ step.running.toFixed(2) }}
                    </p>
                    <p class="text-xs text-white/25 mt-1 font-mono">{{ step.formula }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Indicatori -->
          @if (indicators()) {
            <div class="rounded-2xl mb-5 overflow-hidden"
                 style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
              <div class="px-5 py-4" style="border-bottom:1px solid rgba(255,255,255,0.08)">
                <h2 class="text-sm font-semibold text-white/80 uppercase tracking-widest">Indicatori</h2>
              </div>
              <div>
                <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid rgba(255,255,255,0.06)">
                  <span class="text-sm text-white/55">Reddito equivalente OCSE</span>
                  <span class="text-sm font-semibold text-white">
                    € {{ indicators()!.oecd.redditoEquivalente.toFixed(0) }}/mese
                    <span class="text-white/30 font-normal text-xs">×{{ indicators()!.oecd.coefficiente.toFixed(1) }}</span>
                  </span>
                </div>
                <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid rgba(255,255,255,0.06)">
                  <span class="text-sm text-white/55">Quota impegnata in rate</span>
                  <span class="text-sm font-bold"
                        [style.color]="indicators()!.debito.quotaImpegnata > 0.33 ? '#FF50A0' : '#4ade80'">
                    {{ (indicators()!.debito.quotaImpegnata * 100).toFixed(0) }}%
                  </span>
                </div>
                @if (indicators()!.debito.liberazioneMesi > 0) {
                  <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid rgba(255,255,255,0.06)">
                    <span class="text-sm text-white/55">Liberazione dalle rate tra</span>
                    <span class="text-sm font-semibold text-white">{{ indicators()!.debito.liberazioneMesi }} mesi</span>
                  </div>
                }
                <div class="px-5 py-3.5 flex justify-between items-center">
                  <span class="text-sm text-white/55">Saldo reale</span>
                  <span class="text-sm font-bold"
                        [style.color]="indicators()!.bilancio.saldoReale < 0 ? '#FF50A0' : '#fff'">
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
          class="w-full bg-[#A100FF] hover:bg-[#8800d9] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all">
          Imposta un obiettivo →
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
