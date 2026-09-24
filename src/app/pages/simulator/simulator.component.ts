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
    <div class="min-h-screen bg-[#050008] text-white px-4 py-10">
      <div class="max-w-lg mx-auto">

        @if (!goal()) {
          <div class="rounded-2xl p-8 text-center" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
            <p class="text-white/50 mb-4">Devi prima impostare un obiettivo.</p>
            <button type="button" (click)="router.navigate(['/goals'])"
              class="bg-[#A100FF] text-white px-6 py-2.5 rounded-xl font-semibold">
              Vai agli obiettivi
            </button>
          </div>
        } @else {
          <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-6">Safe to Spend · Simulatore</p>
          <h1 class="text-3xl font-bold mb-2">Quanto ci metti?</h1>
          <p class="text-white/45 mb-6 leading-relaxed">
            Muovi gli slider per vedere come cambia la data di arrivo.
          </p>

          <!-- Obiettivo card -->
          <div class="rounded-2xl p-4 mb-5 flex items-center justify-between"
               style="background:rgba(161,0,255,0.08);border:1px solid rgba(161,0,255,0.25)">
            <div>
              <p class="text-xs text-[#BE82FF] uppercase tracking-widest mb-0.5">Obiettivo</p>
              <p class="font-bold text-white text-lg">{{ goal()!.cosa }}</p>
              <p class="text-sm text-white/45">€ {{ goal()!.importo.toLocaleString('it-IT') }} · entro {{ goal()!.mesi }} mesi</p>
            </div>
            <span class="text-3xl">🎯</span>
          </div>

          <!-- Slider leve -->
          @if (leve().length > 0) {
            <div class="rounded-2xl p-5 mb-5" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
              <h2 class="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">Le tue leve</h2>
              <div class="space-y-5">
                @for (leva of leve(); track leva.categoria) {
                  <div>
                    <div class="flex justify-between text-sm mb-2">
                      <span class="font-medium text-white/80">{{ label(leva.categoria) }}</span>
                      <span class="font-semibold" style="color:#FF50A0">- € {{ getSlider(leva.categoria).toFixed(0) }}/mese</span>
                    </div>
                    <input type="range" min="0" [max]="leva.maxSpesa" step="10"
                      [value]="getSlider(leva.categoria)"
                      (input)="setSlider(leva.categoria, +$any($event.target).value)"
                      class="w-full accent-[#A100FF]">
                    <div class="flex justify-between text-xs text-white/25 mt-1">
                      <span>€ 0</span><span>€ {{ leva.maxSpesa.toFixed(0) }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Risultati affiancati -->
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="rounded-2xl p-4" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10)">
              <p class="text-[10px] uppercase tracking-widest text-white/40 mb-2">A ritmo invariato</p>
              @if (mesiSenzaRiduzioni() > 0) {
                <p class="font-bold text-white text-lg leading-tight">{{ dataArrivo(mesiSenzaRiduzioni()) }}</p>
                <p class="text-xs text-white/35 mt-1">{{ mesiSenzaRiduzioni().toFixed(0) }} mesi</p>
              } @else {
                <p class="text-sm text-[#FF50A0]">Margine non sufficiente</p>
              }
            </div>
            <div class="rounded-2xl p-4 transition-all"
                 [style.background]="riduzioneTotale() > 0 && mesiConRiduzioni() < mesiSenzaRiduzioni() ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.05)'"
                 [style.border]="riduzioneTotale() > 0 && mesiConRiduzioni() < mesiSenzaRiduzioni() ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.10)'">
              <p class="text-[10px] uppercase tracking-widest mb-2"
                 [style.color]="riduzioneTotale() > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)'">
                Con le tue riduzioni
              </p>
              @if (riduzioneTotale() > 0) {
                @if (mesiConRiduzioni() > 0) {
                  <p class="font-bold text-white text-lg leading-tight">{{ dataArrivo(mesiConRiduzioni()) }}</p>
                  <p class="text-xs mt-1" style="color:#4ade80">{{ mesiConRiduzioni().toFixed(0) }} mesi · -€ {{ riduzioneTotale().toFixed(0) }}/m</p>
                } @else {
                  <p class="text-sm" style="color:#FF50A0">Non raggiungibile</p>
                }
              } @else {
                <p class="text-sm text-white/30">Muovi gli slider</p>
              }
            </div>
          </div>

          <!-- Disclaimer -->
          <div class="rounded-xl p-4 text-xs" style="background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.2);color:rgba(251,191,36,0.7)">
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
