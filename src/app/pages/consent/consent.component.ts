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
    <div class="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <div class="w-full max-w-lg">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Accesso ai tuoi dati</h1>
        <p class="text-gray-600 mb-8">
          Dicci a quali informazioni puoi darci accesso. Puoi revocare in qualsiasi momento.
        </p>

        <div class="space-y-4 mb-8">
          @for (source of sources(); track source.id) {
            <div class="bg-white rounded-xl border border-gray-200 p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <p class="font-semibold text-gray-900">{{ source.label }}</p>
                  <p class="text-sm text-gray-500 mt-0.5">
                    <span class="font-medium">Cosa:</span> {{ source.what }}
                  </p>
                  <p class="text-sm text-gray-500">
                    <span class="font-medium">Perché:</span> {{ source.why }}
                  </p>
                </div>
                @if (source.required) {
                  <span class="text-xs text-gray-400 mt-1 whitespace-nowrap">sempre attivo</span>
                } @else {
                  <button
                    type="button"
                    (click)="toggle(source.id)"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-1"
                    [class.bg-blue-600]="source.enabled"
                    [class.bg-gray-200]="!source.enabled"
                    [attr.aria-pressed]="source.enabled"
                    [attr.aria-label]="'Attiva ' + source.label">
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      [class.translate-x-6]="source.enabled"
                      [class.translate-x-1]="!source.enabled">
                    </span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <p class="text-xs text-gray-400 mb-6">
          Senza consenso aggiuntivo il flusso continua con i soli dati del conto principale.
        </p>

        <button
          type="button"
          (click)="proceed()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
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
    this.router.navigate(['/setup']);
  }
}

