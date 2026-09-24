export type SpendingProfile = 'tightly_budgeted' | 'balanced' | 'comfortable';

export interface StepAnswer {
  question: string;
  answer: string;
}

export interface AgentState {
  answers: StepAnswer[];
  step1?: { safeToSpend: string; summary: string };
  step2?: { spendingProfile: SpendingProfile; rationale: string };
  step3?: { canSpendOn: string[]; avoid: string[]; nextStep: string };
}

export interface UserProfile {
  safeToSpend: string;
  summary: string;
  spendingProfile: SpendingProfile;
  rationale: string;
  canSpendOn: string[];
  avoid: string[];
  nextStep: string;
}
