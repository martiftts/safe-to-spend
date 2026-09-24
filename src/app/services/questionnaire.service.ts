import { Injectable, signal } from '@angular/core';
import { Question } from '../models/question.model';
import { StepAnswer } from '../models/profile.model';

export const QUESTIONS: Question[] = [
  {
    id: 0,
    text: 'Quanti siete nel tuo nucleo familiare?',
    options: [
      { label: 'Vivo da solo', value: 'solo' },
      { label: 'In coppia', value: 'coppia' },
      { label: 'Famiglia con 1–2 figli', value: 'famiglia-piccola' },
      { label: 'Famiglia con 3 o più figli', value: 'famiglia-grande' },
    ],
  },
  {
    id: 1,
    text: 'Quali sono le tue entrate nette mensili?',
    options: [
      { label: 'Meno di €1.000', value: '<1000' },
      { label: '€1.000 – €2.000', value: '1000-2000' },
      { label: '€2.000 – €3.500', value: '2000-3500' },
      { label: 'Più di €3.500', value: '>3500' },
    ],
  },
  {
    id: 2,
    text: 'Quanto spendi in spese fisse al mese? (affitto/mutuo, bollette, abbonamenti)',
    options: [
      { label: 'Meno di €400', value: '<400' },
      { label: '€400 – €800', value: '400-800' },
      { label: '€800 – €1.400', value: '800-1400' },
      { label: 'Più di €1.400', value: '>1400' },
    ],
  },
  {
    id: 3,
    text: 'Hai rate o debiti in corso? (prestiti, finanziamenti, carta rateale)',
    options: [
      { label: 'No', value: 'no' },
      { label: 'Sì, meno di €200 al mese', value: 'si-piccoli' },
      { label: 'Sì, più di €200 al mese', value: 'si-significativi' },
    ],
  },
  {
    id: 4,
    text: 'Come gestisci attualmente le tue spese quotidiane?',
    options: [
      { label: 'Non le traccio', value: 'non-traccio' },
      { label: 'Le appunto a mano', value: 'appunto' },
      { label: 'Uso un\'app o un foglio Excel', value: 'app-excel' },
      { label: 'Ho un budget fisso mensile', value: 'budget-fisso' },
    ],
  },
  {
    id: 5,
    text: 'Hai spese importanti previste nei prossimi 6 mesi?',
    options: [
      { label: 'No, niente di pianificato', value: 'no' },
      { label: 'Sì, una vacanza o evento', value: 'vacanza-evento' },
      { label: 'Sì, un acquisto grande (auto, elettrodomestico…)', value: 'acquisto-grande' },
      { label: 'Sì, più cose insieme', value: 'piu-cose' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  readonly questions = QUESTIONS;
  readonly answers = signal<(string | null)[]>(Array(QUESTIONS.length).fill(null));

  setAnswer(questionId: number, value: string): void {
    this.answers.update(prev => {
      const next = [...prev];
      next[questionId] = value;
      return next;
    });
  }

  isComplete(): boolean {
    return this.answers().every(a => a !== null);
  }

  toStepAnswers(): StepAnswer[] {
    return QUESTIONS.map((q, i) => ({
      question: q.text,
      answer: this.answers()[i] ?? '',
    }));
  }

  reset(): void {
    this.answers.set(Array(QUESTIONS.length).fill(null));
  }
}
