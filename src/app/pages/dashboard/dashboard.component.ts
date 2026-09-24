import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BankingService } from '../../services/banking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-inner">

        <p class="eyebrow mb-6">Safe to Spend · Cruscotto</p>

        <!-- Banner scorciatoia -->
        @if (banking.entryMode() === 'scorciatoia') {
          <div class="rounded-2xl mb-5 px-4 py-3 flex items-center justify-between gap-3"
               style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25)">
            <p class="text-sm" style="color:rgba(251,191,36,0.85)">
              Profilo di esempio: <strong>{{ banking.preset()?.label }}</strong>
            </p>
            <button type="button" (click)="ricomincia()"
                    class="btn-inline shrink-0 active:scale-[0.97] transition-transform">
              Fai il percorso
            </button>
          </div>
        }

        <!-- Nessun profilo -->
        @if (!banking.hasProfile()) {
          <div class="card-dark p-8 text-center">
            <p class="text-muted mb-4">Non ci sono ancora dati da mostrare.</p>
            <button type="button" (click)="ricomincia()" class="btn-primary" style="width:auto;padding-left:2rem;padding-right:2rem">
              Inizia
            </button>
          </div>
        }

        <!-- Budget giornaliero -->
        @if (chain()) {
          <div class="rounded-2xl p-6 mb-5"
               [style.background]="chain()!.margine >= 0 ? 'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.05))' : 'linear-gradient(135deg,rgba(255,80,160,0.15),rgba(255,80,160,0.05))'"
               [style.border]="chain()!.margine >= 0 ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,80,160,0.3)'">
            <p class="text-xs uppercase tracking-widest mb-2"
               [style.color]="chain()!.margine >= 0 ? 'var(--green)' : 'var(--rose)'">
              Budget giornaliero disponibile
            </p>
            <p class="text-5xl font-bold tracking-tight"
               [style.color]="chain()!.margine >= 0 ? 'var(--green)' : 'var(--rose)'">
              € {{ chain()!.budgetGiornaliero.toFixed(0) }}<span class="text-xl font-normal opacity-50">/g</span>
            </p>
            <p class="text-sm mt-2 text-muted">
              Margine mensile: <strong class="text-white">€ {{ chain()!.margine.toFixed(0) }}</strong>
            </p>
          </div>

          <!-- Catena a scalini -->
          <div class="card-dark mb-5 overflow-hidden">
            <div class="card-dark-header">
              <h2 class="card-section-label">Come l'abbiamo calcolato</h2>
            </div>
            @for (step of chain()!.steps; track step.label; let i = $index) {
              <div style="border-bottom:1px solid var(--line)" class="last:border-0">
                <button type="button" (click)="toggleStep(i)"
                        class="w-full flex items-center justify-between px-5 py-3.5 text-left
                               hover:bg-white/5 active:scale-[0.99] transition-all">
                  <span class="text-sm text-muted">{{ step.label }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold"
                          [style.color]="step.amount < 0 ? 'var(--rose)' : 'var(--green)'">
                      {{ step.amount >= 0 ? '+' : '' }}€ {{ step.amount.toFixed(0) }}
                    </span>
                    <span class="text-faint text-xs">{{ expandedSteps().has(i) ? '▲' : '▼' }}</span>
                  </div>
                </button>
                @if (expandedSteps().has(i)) {
                  <div class="px-5 pb-4" style="background:rgba(255,255,255,0.02)">
                    <p class="text-xs text-faint mb-1">Progressivo:</p>
                    <p class="text-sm font-bold"
                       [style.color]="step.running < 0 ? 'var(--rose)' : '#fff'">
                      € {{ step.running.toFixed(2) }}
                    </p>
                    <p class="text-xs text-faint mt-1 font-mono">{{ step.formula }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Indicatori -->
          @if (indicators()) {
            <div class="card-dark mb-5 overflow-hidden">
              <div class="card-dark-header">
                <h2 class="card-section-label">Indicatori</h2>
              </div>
              <div>
                <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid var(--line)">
                  <span class="text-sm text-muted">Reddito equivalente OCSE</span>
                  <span class="text-sm font-semibold text-white">
                    € {{ indicators()!.oecd.redditoEquivalente.toFixed(0) }}/mese
                    <span class="text-faint font-normal text-xs">×{{ indicators()!.oecd.coefficiente.toFixed(1) }}</span>
                  </span>
                </div>
                <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid var(--line)">
                  <span class="text-sm text-muted">Quota impegnata in rate</span>
                  <span class="text-sm font-bold"
                        [style.color]="indicators()!.debito.quotaImpegnata > 0.33 ? 'var(--rose)' : 'var(--green)'">
                    {{ (indicators()!.debito.quotaImpegnata * 100).toFixed(0) }}%
                  </span>
                </div>
                @if (indicators()!.debito.liberazioneMesi > 0) {
                  <div class="px-5 py-3.5 flex justify-between items-center" style="border-bottom:1px solid var(--line)">
                    <span class="text-sm text-muted">Liberazione dalle rate tra</span>
                    <span class="text-sm font-semibold text-white">{{ indicators()!.debito.liberazioneMesi }} mesi</span>
                  </div>
                }
                <div class="px-5 py-3.5 flex justify-between items-center">
                  <span class="text-sm text-muted">Saldo reale</span>
                  <span class="text-sm font-bold"
                        [style.color]="indicators()!.bilancio.saldoReale < 0 ? 'var(--rose)' : '#fff'">
                    € {{ indicators()!.bilancio.saldoReale.toFixed(0) }}
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- CTA -->
          <button type="button" (click)="router.navigate(['/goals'])" class="btn-primary mb-3">
            Imposta un obiettivo →
          </button>
          <button type="button" (click)="ricomincia()" class="btn-inline w-full text-center text-sm py-2">
            Svuota e ricomincia
          </button>
        }
      </div>
    </div>
  `,
})
export class DashboardPage {
  readonly banking: BankingService = inject(BankingService);
  readonly router: Router = inject(Router);

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

  ricomincia(): void {
    this.banking.reset();
    this.router.navigate(['/']);
  }
}
