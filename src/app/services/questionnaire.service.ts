import { Injectable, signal } from '@angular/core';
import { Question } from '../models/question.model';
import { StepAnswer } from '../models/profile.model';

export const QUESTIONS: Question[] = [
  {
    id: 0,
    text: 'Quanti anni hai?',
    options: [
      { label: 'Meno di 25', value: '<25' },
      { label: '25–34', value: '25-34' },
      { label: '35–50', value: '35-50' },
      { label: 'Più di 50', value: '>50' },
    ],
  },
  {
    id: 1,
    text: 'Come valuti la tua familiarità con la finanza personale?',
    options: [
      { label: 'Nessuna — non ci capisco niente', value: 'nessuna' },
      { label: 'Minima — so cosa è un conto', value: 'minima' },
      { label: 'Discreta — gestisco qualcosa', value: 'discreta' },
      { label: 'Buona — monitoro entrate e uscite', value: 'buona' },
    ],
  },
  {
    id: 2,
    text: 'Hai un conto corrente attivo?',
    options: [
      { label: 'Sì', value: 'si' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 3,
    text: 'Riesci a mettere qualcosa da parte ogni mese?',
    options: [
      { label: 'Mai — arrivo a malapena alla fine del mese', value: 'mai' },
      { label: 'A volte — dipende dal mese', value: 'a volte' },
      { label: 'Sì, una piccola quota', value: 'si poco' },
      { label: 'Sì, ho un piano di risparmio', value: 'si piano' },
    ],
  },
  {
    id: 4,
    text: 'Cosa ti mette più in difficoltà?',
    options: [
      { label: 'Capire la busta paga', value: 'busta paga' },
      { label: 'Gestire le spese quotidiane', value: 'spese quotidiane' },
      { label: 'Tasse e adempimenti fiscali', value: 'tasse' },
      { label: 'Capire i prodotti bancari (mutuo, prestito…)', value: 'prodotti bancari' },
    ],
  },
  {
    id: 5,
    text: 'Hai sentito parlare di TAEG, tasso d\'interesse o inflazione?',
    options: [
      { label: 'Sì, so cosa significano', value: 'si' },
      { label: 'Ne ho sentito parlare ma non sono sicuro', value: 'vagamente' },
      { label: 'No, mai', value: 'no' },
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
