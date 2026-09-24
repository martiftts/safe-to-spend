import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { ClaudeService } from '../../services/claude.service';

@Component({
  standalone: true,
  selector: 'app-questionnaire',
  template: `
    <div class="min-h-screen bg-[#050008] text-white flex flex-col">

      <!-- Progress bar -->
      <div class="h-1 bg-white/5">
        <div
          class="h-full bg-gradient-to-r from-[#A100FF] to-[#BE82FF] transition-all duration-500"
          [style.width.%]="progress()"
        ></div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-6">
          <div class="text-5xl animate-pulse">🧠</div>
          <p class="text-white/50 text-sm">
            @switch (claudeService.status()) {
              @case ('step1') { Analizzando le tue risposte... }
              @case ('step2') { Identificando il tuo profilo... }
              @case ('step3') { Preparando le micro-lezioni... }
              @default { Elaborazione in corso... }
            }
          </p>
          <div class="flex gap-2 mt-2">
            @for (s of steps; track s; let i = $index) {
              <div
                class="w-2 h-2 rounded-full transition-all duration-300"
                [class]="isStepDone(i) ? 'bg-[#A100FF]' : 'bg-white/15'"
              ></div>
            }
          </div>
        </div>

      } @else {
        <!-- Question -->
        <div class="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto w-full">

          <p class="text-xs text-white/35 uppercase tracking-widest mb-8">
            {{ currentStep() + 1 }} di {{ totalSteps }}
          </p>

          <h2 class="text-2xl font-semibold text-center mb-10 leading-snug">
            {{ question().text }}
          </h2>

          <div class="flex flex-col gap-3 w-full">
            @for (opt of question().options; track opt.value) {
              <button
                (click)="select(opt.value)"
                class="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#A100FF]/70 hover:bg-[#A100FF]/10 transition-all text-sm font-medium"
              >
                {{ opt.label }}
              </button>
            }
          </div>

          @if (currentStep() > 0) {
            <button
              (click)="back()"
              class="mt-8 text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              ← Indietro
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class QuestionnairePage {
  protected readonly claudeService = inject(ClaudeService);
  private readonly qs = inject(QuestionnaireService);
  private readonly router = inject(Router);

  readonly steps = ['step1', 'step2', 'step3'];
  readonly currentStep = signal(0);
  readonly loading = signal(false);
  readonly totalSteps = this.qs.questions.length;

  readonly progress = computed(() => ((this.currentStep() + 1) / this.totalSteps) * 100);
  readonly question = computed(() => this.qs.questions[this.currentStep()]);

  isStepDone(index: number): boolean {
    const order: Record<string, number> = { step1: 0, step2: 1, step3: 2, done: 3 };
    return (order[this.claudeService.status()] ?? -1) > index;
  }

  async select(value: string) {
    this.qs.setAnswer(this.currentStep(), value);
    if (this.currentStep() < this.totalSteps - 1) {
      this.currentStep.update(s => s + 1);
    } else {
      await this.finish();
    }
  }

  async finish() {
    this.loading.set(true);
    try {
      await this.claudeService.runWorkflow(this.qs.toStepAnswers());
    } finally {
      this.router.navigate(['/profile']);
    }
  }

  back() {
    if (this.currentStep() > 0) this.currentStep.update(s => s - 1);
  }
}
