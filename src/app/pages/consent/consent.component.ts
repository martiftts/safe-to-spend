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
    <div class="page flex flex-col items-center">
      <div class="page-inner w-full">

        <p class="eyebrow mb-8">Safe to Spend · Consenso ai dati</p>
        <h1 class="text-3xl font-bold mb-2">Cosa condividi con noi</h1>
        <p class="text-muted mb-8 leading-relaxed">Scegli a quali fonti dare accesso. Puoi revocare in qualsiasi momento.</p>

        <div class="space-y-3 mb-8">
          @for (source of sources(); track source.id) {
            <div class="card-dark p-4 transition-colors"
                 [style.background]="source.enabled ? 'rgba(161,0,255,0.08)' : 'var(--panel)'"
                 [style.border-color]="source.enabled ? 'rgba(161,0,255,0.4)' : 'var(--line)'">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <p class="font-semibold text-white">{{ source.label }}</p>
                  <p class="text-xs text-faint mt-1 leading-relaxed">{{ source.what }} · {{ source.why }}</p>
                </div>
                @if (source.required) {
                  <span class="text-[10px] uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded-full mt-1"
                        style="color:var(--brand);background:rgba(161,0,255,0.12)">richiesto</span>
                } @else {
                  <button
                    type="button"
                    (click)="toggle(source.id)"
                    class="toggle-track mt-1"
                    [style.background]="source.enabled ? 'var(--brand)' : 'rgba(255,255,255,0.15)'"
                    [attr.aria-pressed]="source.enabled"
                    [attr.aria-label]="'Attiva ' + source.label">
                    <span class="toggle-thumb"
                          [class.translate-x-6]="source.enabled"
                          [class.translate-x-1]="!source.enabled"></span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <p class="text-faint text-xs mb-6 text-center">
          Senza consenso aggiuntivo il flusso usa solo il conto principale.
        </p>

        <button type="button" (click)="proceed()" class="btn-primary">Continua</button>
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
    this.router.navigate(['/lettura']);
  }
}

