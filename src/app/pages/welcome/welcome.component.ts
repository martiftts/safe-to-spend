import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClaudeService } from '../../services/claude.service';

@Component({
  standalone: true,
  selector: 'app-welcome',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-[#050008] text-white flex flex-col items-center justify-center px-6 py-16">

      <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-10">
        Accenture · Hagenthon 2026 · Tema 02
      </p>

      <h1 class="text-5xl font-bold tracking-tight text-center mb-4">
        <span class="bg-gradient-to-r from-[#BE82FF] to-[#A100FF] bg-clip-text text-transparent">
          Safe to Spend
        </span>
      </h1>

      <p class="text-white/60 text-lg max-w-sm text-center leading-relaxed mb-12">
        Scopri il tuo profilo finanziario e ricevi micro-lezioni personalizzate in 2 minuti.
      </p>

      <div class="w-full max-w-xs mb-10">
        <details>
          <summary class="text-xs text-white/30 hover:text-white/50 cursor-pointer transition-colors text-center list-none select-none">
            ⚙ Inserisci Claude API Key (opzionale)
          </summary>
          <div class="mt-3 flex flex-col gap-2">
            <input
              type="password"
              [(ngModel)]="apiKey"
              placeholder="sk-ant-..."
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#A100FF] transition-colors"
            />
            <p class="text-[11px] text-white/25 text-center">
              Senza key il fallback locale produce lo stesso risultato
            </p>
          </div>
        </details>
      </div>

      <div class="flex flex-col gap-3 w-full max-w-xs">
        <button
          (click)="start()"
          class="bg-[#A100FF] hover:bg-[#8800d9] active:scale-95 text-white font-semibold px-10 py-3.5 rounded-xl transition-all text-base"
        >
          Questionario educativo →
        </button>
        <button
          (click)="startBanking()"
          class="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold px-10 py-3.5 rounded-xl transition-all text-base border border-white/20"
        >
          Flusso bancario →
        </button>
      </div>

      <div class="flex items-center gap-2 mt-14 flex-wrap justify-center text-xs text-white/25">
        <span class="px-3 py-1 border border-white/10 rounded-full">📝 Questionario</span>
        <span>→</span>
        <span class="px-3 py-1 border border-white/10 rounded-full">🔍 Analyze</span>
        <span>→</span>
        <span class="px-3 py-1 border border-white/10 rounded-full">🏷️ Classify</span>
        <span>→</span>
        <span class="px-3 py-1 border border-white/10 rounded-full">📚 Educate</span>
      </div>

      <p class="text-white/15 text-[10px] uppercase tracking-widest mt-10">
        Educazione finanziaria · Non è consulenza finanziaria
      </p>
    </div>
  `,
})
export class WelcomePage {
  private readonly router = inject(Router);
  private readonly claudeService = inject(ClaudeService);

  apiKey = '';

  start() {
    if (this.apiKey.trim()) {
      this.claudeService.setApiKey(this.apiKey.trim());
    }
    this.router.navigate(['/questionnaire']);
  }

  startBanking() {
    this.router.navigate(['/consent']);
  }
}
