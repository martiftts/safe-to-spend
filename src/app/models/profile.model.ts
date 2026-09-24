export type Archetype = 'novice' | 'aware' | 'practitioner';

export interface Lesson {
  title: string;
  body: string;
  emoji: string;
}

export interface StepAnswer {
  question: string;
  answer: string;
}

export interface AgentState {
  answers: StepAnswer[];
  step1?: { painPoint: string; summary: string };
  step2?: { archetype: Archetype; score: number; rationale: string };
  step3?: { lessons: Lesson[]; nextStep: string };
}

export interface UserProfile {
  archetype: Archetype;
  score: number;
  painPoint: string;
  summary: string;
  rationale: string;
  lessons: Lesson[];
  nextStep: string;
}
