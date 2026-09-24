import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClaudeService } from '../../services/claude.service';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { UserProfile, SpendingProfile } from '../../models/profile.model';

const PROFILE_META: Record<SpendingProfile, { emoji: string; label: string; color: string }> = {
  tightly_budgeted: { emoji: '⚡', label: 'Margine ridotto',  color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' },
  balanced:         { emoji: '⚖️', label: 'Bilanciato',       color: 'border-[#A100FF]/40 bg-[#A100FF]/10 text-[#BE82FF]' },
  comfortable:      { emoji: '🟢', label: 'Ampio margine',    color: 'border-green-500/40 bg-green-500/10 text-green-300' },
};

@Component({
  standalone: true,
  selector: 'app-profile',
  template: `
    @if (profile) {
      <div class="min-h-screen bg-[#050008] text-white px-6 py-14">
        <div class="max-w-lg mx-auto">

          <p class="text-[11px] uppercase tracking-[0.25em] text-[#BE82FF] mb-10 text-center">
            Safe to Spend · Il tuo profilo
          </p>

          <!-- Safe to spend -->
          <div class="text-center mb-10">
            <p class="text-xs text-white/35 uppercase tracking-widest mb-2">Il tuo margine mensile</p>
            <div class="text-5xl font-bold tracking-tight mb-3">
              <span class="bg-gradient-to-r from-[#BE82FF] to-[#A100FF] bg-clip-text text-transparent">
                {{ profile.safeToSpend }}
              </span>
            </div>
            <span class="inline-block px-4 py-1.5 rounded-full border text-xs uppercase tracking-widest {{ meta.color }}">
              {{ meta.emoji }} {{ meta.label }}
            </span>
            <p class="text-white/40 text-xs mt-3 max-w-xs mx-auto leading-relaxed">{{ profile.rationale }}</p>
          </div>

          <!-- Summary -->
          <div class="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6">
            <p class="text-[11px] text-[#BE82FF] uppercase tracking-widest mb-2">Il tuo profilo</p>
            <p class="text-white/70 text-sm leading-relaxed">{{ profile.summary }}</p>
          </div>

          <!-- Can spend / Avoid -->
          <div class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">

            <div class="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
              <p class="text-[11px] text-green-400 uppercase tracking-widest mb-3">✅ Puoi permetterti</p>
              <ul class="flex flex-col gap-2">
                @for (item of profile.canSpendOn; track item) {
                  <li class="text-sm text-white/70 leading-relaxed flex gap-2">
                    <span class="text-green-500 mt-0.5 shrink-0">·</span>{{ item }}
                  </li>
                }
              </ul>
            </div>

            <div class="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <p class="text-[11px] text-red-400 uppercase tracking-widest mb-3">⚠️ Evita</p>
              <ul class="flex flex-col gap-2">
                @for (item of profile.avoid; track item) {
                  <li class="text-sm text-white/70 leading-relaxed flex gap-2">
                    <span class="text-red-400 mt-0.5 shrink-0">·</span>{{ item }}
                  </li>
                }
              </ul>
            </div>

          </div>

          <!-- Next step -->
          <div class="bg-[#A100FF]/10 border border-[#A100FF]/30 rounded-xl p-5 mb-8">
            <p class="text-[11px] text-[#BE82FF] uppercase tracking-widest mb-2">Cosa puoi fare subito</p>
            <p class="text-white/75 text-sm leading-relaxed">{{ profile.nextStep }}</p>
          </div>

          <!-- Restart -->
          <button
            (click)="restart()"
            class="w-full border border-white/10 text-white/35 hover:text-white hover:border-white/25 py-3 rounded-xl transition-colors text-sm"
          >
            Ricomincia
          </button>

          <p class="text-center text-white/15 text-[10px] uppercase tracking-widest mt-8">
            Educazione finanziaria · Non è consulenza finanziaria
          </p>
        </div>
      </div>

    } @else {
      <div class="min-h-screen bg-[#050008] flex items-center justify-center">
        <div class="text-center">
          <p class="text-white/40 mb-4">Nessun profilo disponibile.</p>
          <button (click)="restart()" class="text-[#BE82FF] underline text-sm">Torna all'inizio</button>
        </div>
      </div>
    }
  `,
})
export class ProfilePage implements OnInit {
  private readonly claudeService = inject(ClaudeService);
  private readonly qs = inject(QuestionnaireService);
  private readonly router = inject(Router);

  profile: UserProfile | null = null;
  meta = PROFILE_META['balanced'];

  ngOnInit() {
    this.profile = this.claudeService.profile();
    if (!this.profile) {
      this.router.navigate(['/']);
      return;
    }
    this.meta = PROFILE_META[this.profile.spendingProfile] ?? PROFILE_META['balanced'];
  }

  restart() {
    this.qs.reset();
    this.router.navigate(['/']);
  }
}
