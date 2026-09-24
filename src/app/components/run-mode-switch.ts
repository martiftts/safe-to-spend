import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RunModeService } from '../services/run-mode.service';

/**
 * Interruttore fra modalità live e locale, con inserimento della chiave a runtime.
 *
 * Componente autonomo: si innesta ovunque con <app-run-mode-switch />.
 *
 * La chiave non sta nel bundle né nel repository. Vive in sessionStorage e
 * sparisce alla chiusura del browser. Per un prototipo è la soluzione corretta;
 * in produzione la chiamata passerebbe da un proxy server-side e il browser non
 * vedrebbe mai una credenziale.
 */
@Component({
  selector: 'app-run-mode-switch',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="font-semibold text-slate-900">Modalità di esecuzione</p>
          <p class="text-slate-500">
            @if (runMode.mode() === 'live') {
              I tre step chiamano il modello.
            } @else {
              Percorsi deterministici, nessuna chiamata di rete.
            }
          </p>
        </div>

        <div class="flex shrink-0 rounded-lg bg-slate-100 p-1" role="group" aria-label="Modalità">
          <button
            type="button"
            (click)="runMode.setMode('local')"
            [attr.aria-pressed]="runMode.mode() === 'local'"
            [class]="runMode.mode() === 'local' ? active : inactive">
            Locale
          </button>
          <button
            type="button"
            (click)="runMode.setMode('live')"
            [attr.aria-pressed]="runMode.mode() === 'live'"
            [class]="runMode.mode() === 'live' ? active : inactive">
            Live
          </button>
        </div>
      </div>

      @if (runMode.liveUnavailable()) {
        <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
          Per la modalità live serve una chiave API. Senza, resta attiva quella locale.
        </p>
      }

      @if (runMode.canGoLive()) {
        <button type="button" class="mt-3 text-slate-500 underline" (click)="runMode.clearApiKey()">
          Rimuovi la chiave
        </button>
      } @else {
        <div class="mt-3 flex gap-2">
          <input
            type="password"
            [(ngModel)]="draft"
            placeholder="sk-ant-…"
            autocomplete="off"
            aria-label="Chiave API"
            class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-40"
            [disabled]="!draft().trim()"
            (click)="save()">
            Salva
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-400">
          Resta in questa scheda del browser e sparisce alla chiusura. Non viene inviata a nessun
          server tranne l'API del modello.
        </p>
      }
    </div>
  `,
})
export class RunModeSwitch {
  protected readonly runMode = inject(RunModeService);
  protected readonly draft = signal('');

  protected readonly active = 'rounded-md bg-white px-3 py-1.5 font-medium text-slate-900 shadow-sm';
  protected readonly inactive = 'rounded-md px-3 py-1.5 text-slate-500';

  protected save(): void {
    this.runMode.setApiKey(this.draft());
    this.runMode.setMode('live');
    this.draft.set('');
  }
}
