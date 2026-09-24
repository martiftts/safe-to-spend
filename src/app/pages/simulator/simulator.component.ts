import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BankingService, type Categoria } from '../../services/banking.service';
import { runGuardrail } from '../../services/guardrail';

interface SimulatorState {
  goal?: { cosa: string; importo: number; mesi: number };
  leve?: Array<{ categoria: Categoria; riduzione: number }>;
}

const CATEGORIE_LABEL: Record<string, string> = {
  casa: 'Casa', trasporti: 'Trasporti', alimentari: 'Alimentari',
  salute: 'Salute', abbonamenti: 'Abbonamenti', tempo_libero: 'Tempo libero', altro: 'Altro',
};

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-10">
      <div class="max-w-lg mx-auto">

        @if (!goal()) {
          <div class="bg-white rounded-xl p-6 text-center">
            <p class="text-gray-600 mb-4">Devi prima impostare un obiettivo.</p>
            <button type="button" (click)="router.navigate(['/goals'])"
              class="bg-blue-600 text-white px-6 py-2 rounded-lg">Vai agli obiettivi</button>
          </div>
        } @else {
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Simulatore</h1>
          <p class="text-gray-600 mb-6">
            Muovi gli slider per vedere come cambia la data di arrivo.
            Puoi agire solo sulle categorie che hai marcato tu.
          </p>

          <!-- Obiettivo -->
          <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p class="text-sm text-gray-500">Obiettivo</p>
            <p class="font-bold text-gray-900 text-lg">{{ goal()!.cosa }}</p>
            <p class="text-sm text-gray-600">€ {{ goal()!.importo.toLocaleString('it-IT') }} · entro {{ goal()!.mesi }} mesi</p>
          </div>

          <!-- Slider leve -->
          @if (leve().length > 0) {
            <div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h2 class="font-semibold text-gray-900 mb-4">Le tue leve</h2>
              <div class="space-y-4">
                @for (leva of leve(); track leva.categoria) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="font-medium text-gray-800">{{ label(leva.categoria) }}</span>
                      <span class="text-blue-600 font-medium">- € {{ getSlider(leva.categoria).toFixed(0) }}/mese</span>
                    </div>
                    <input type="range" min="0" [max]="leva.maxSpesa" step="10"
                      [value]="getSlider(leva.categoria)"
                      (input)="setSlider(leva.categoria, +$any($event.target).value)"
                      class="w-full accent-blue-600">
                    <div class="flex justify-between text-xs text-gray-400">
                      <span>€ 0</span><span>€ {{ leva.maxSpesa.toFixed(0) }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Risultati -->
          <div class="space-y-3 mb-6">
            <!-- Scenario zero riduzioni (riferimento) -->
            <div class="bg-gray-100 rounded-xl p-4">
              <p class="text-xs text-gray-500 mb-1">A ritmo invariato</p>
              <p class="font-bold text-gray-700 text-xl">
                @if (mesiSenzaRiduzioni() > 0) {
                  {{ dataArrivo(mesiSenzaRiduzioni()) }}
                  <span class="text-sm font-normal text-gray-500">({{ mesiSenzaRiduzioni().toFixed(0) }} mesi)</span>
                } @else {
                  Il margine attuale non copre l'obiettivo
                }
              </p>
            </div>

            <!-- Scenario con riduzioni -->
            <div class="rounded-xl p-4"
                 [class.bg-green-50]="mesiConRiduzioni() < mesiSenzaRiduzioni()"
                 [class.border-green-200]="mesiConRiduzioni() < mesiSenzaRiduzioni()"
                 [class.border]="mesiConRiduzioni() < mesiSenzaRiduzioni()"
                 [class.bg-gray-100]="mesiConRiduzioni() >= mesiSenzaRiduzioni()">
              <p class="text-xs text-gray-500 mb-1">Con le riduzioni che hai indicato</p>
              @if (riduzioneTotale() > 0) {
                <p class="font-bold text-gray-900 text-xl">
                  @if (mesiConRiduzioni() > 0) {
                    {{ dataArrivo(mesiConRiduzioni()) }}
                    <span class="text-sm font-normal text-gray-500">({{ mesiConRiduzioni().toFixed(0) }} mesi)</span>
                  } @else {
                    L'obiettivo non è raggiungibile con queste riduzioni
                  }
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  Risparmio aggiuntivo: € {{ riduzioneTotale().toFixed(0) }}/mese
                </p>
              } @else {
                <p class="text-sm text-gray-500">Nessuna riduzione selezionata — stessa data di riferimento.</p>
              }
            </div>
          </div>

          <!-- Disclaimer fisso -->
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Questi numeri derivano dall'obiettivo e dai limiti che hai indicato tu.
            Non sono una raccomandazione finanziaria.
          </div>
        }
      </div>
    </div>
  `,
})
export class SimulatorPage implements OnInit {
  readonly banking: BankingService = inject(BankingService);
  readonly router: Router = inject(Router);

  readonly adviceRequestedAt = signal<Date>(new Date());
  readonly goal = signal<{ cosa: string; importo: number; mesi: number } | null>(null);
  readonly leve = signal<Array<{ categoria: Categoria; riduzione: number; maxSpesa: number }>>([]);
  readonly sliders = signal<Map<Categoria, number>>(new Map());

  ngOnInit(): void {
    const state = (window.history.state ?? {}) as SimulatorState;
    if (state.goal) this.goal.set(state.goal);

    if (state.leve && this.banking.bankingData()) {
      const spesaPerCat = this.banking.bankingData()!.spesaPerCategoria;
      const leveParsed = state.leve
        .map(l => {
          const spesa = spesaPerCat.find(s => s.categoria === l.categoria);
          return spesa ? { categoria: l.categoria, riduzione: l.riduzione, maxSpesa: spesa.importoMensile } : null;
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);
      this.leve.set(leveParsed);
    }
  }

  getSlider(cat: Categoria): number {
    return this.sliders().get(cat) ?? 0;
  }

  setSlider(cat: Categoria, val: number): void {
    this.sliders.update(m => { const n = new Map(m); n.set(cat, val); return n; });
  }

  riduzioneTotale = computed(() =>
    this.leve().reduce((s, l) => s + this.getSlider(l.categoria), 0)
  );

  margineAttuale = computed(() => this.banking.chain()?.margine ?? 0);

  mesiSenzaRiduzioni = computed(() => {
    const m = this.margineAttuale();
    const g = this.goal();
    if (!g || m <= 0) return -1;
    return g.importo / m;
  });

  mesiConRiduzioni = computed(() => {
    const m = this.margineAttuale() + this.riduzioneTotale();
    const g = this.goal();
    if (!g || m <= 0) return -1;
    return g.importo / m;
  });

  dataArrivo(mesi: number): string {
    if (mesi <= 0) return '—';
    const d = new Date();
    d.setMonth(d.getMonth() + Math.ceil(mesi));
    return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  label(cat: string): string {
    return CATEGORIE_LABEL[cat] ?? cat;
  }
}
