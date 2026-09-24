import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface DataSource {
  id: string;
  label: string;
  what: string;
  why: string;
  required: boolean;
  enabled: boolean;
}

@Component({
  selector: 'app-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-[#050008] text-white flex flex-col items-center px-4 py-12">
      <div class="w-full max-w-lg">

        <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-8">
          Safe to Spend · Consenso ai dati
        </p>

        <h1 class="text-3xl font-bold mb-2">
          Cosa condividi con noi
        </h1>
        <p class="text-white/50 mb-8 leading-relaxed">
          Scegli a quali fonti dare accesso. Puoi revocare in qualsiasi momento.
        </p>

        <div class="space-y-3 mb-8">
          @for (source of sources(); track source.id) {
            <div class="rounded-2xl border p-4 transition-colors"
                 [style.background]="source.enabled ? 'rgba(161,0,255,0.08)' : 'rgba(255,255,255,0.03)'"
                 [style.border-color]="source.enabled ? 'rgba(161,0,255,0.4)' : 'rgba(255,255,255,0.1)'">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <p class="font-semibold text-white">{{ source.label }}</p>
                  <p class="text-xs text-white/40 mt-1 leading-relaxed">
                    {{ source.what }} · {{ source.why }}
                  </p>
                </div>
                @if (source.required) {
                  <span class="text-[10px] uppercase tracking-widest text-[#A100FF] mt-1 whitespace-nowrap bg-[#A100FF]/10 px-2 py-0.5 rounded-full">
                    richiesto
                  </span>
                } @else {
                  <button
                    type="button"
                    (click)="toggle(source.id)"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-all mt-1 flex-shrink-0"
                    [style.background]="source.enabled ? '#A100FF' : 'rgba(255,255,255,0.15)'"
                    [attr.aria-pressed]="source.enabled"
                    [attr.aria-label]="'Attiva ' + source.label">
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow"
                      [class.translate-x-6]="source.enabled"
                      [class.translate-x-1]="!source.enabled">
                    </span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <p class="text-xs text-white/25 mb-6 text-center">
          Senza consenso aggiuntivo il flusso usa solo il conto principale.
        </p>

        <button
          type="button"
          (click)="proceed()"
          class="w-full bg-[#A100FF] hover:bg-[#8800d9] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all text-base">
          Continua
        </button>
      </div>
    </div>
  `,
})
export class ConsentPage {
  private readonly router: Router = inject(Router);

  sources = signal<DataSource[]>([
    {
      id: 'conto-principale',
      label: 'Conto principale',
      what: 'movimenti degli ultimi 3 mesi',
      why: 'calcolare entrate, uscite e spese ricorrenti',
      required: true,
      enabled: true,
    },
    {
      id: 'altri-conti',
      label: 'Altri conti correnti',
      what: 'movimenti degli altri conti che dichiari di avere',
      why: 'avere un quadro completo delle entrate',
      required: false,
      enabled: false,
    },
    {
      id: 'mutui-rate',
      label: 'Mutui e piani rateizzati',
      what: 'rata, scadenza, capitale residuo',
      why: 'calcolare gli impegni fissi e la timeline di liberazione',
      required: false,
      enabled: false,
    },
    {
      id: 'conti-risparmio',
      label: 'Conti di risparmio',
      what: 'saldo e movimenti',
      why: 'includere i fondi disponibili nel saldo reale',
      required: false,
      enabled: false,
    },
  ]);

  consentedIds = computed(() =>
    this.sources()
      .filter(s => s.enabled)
      .map(s => s.id)
  );

  toggle(id: string): void {
    this.sources.update(list =>
      list.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  }

  proceed(): void {
    this.router.navigate(['/dashboard']);
  }
}

