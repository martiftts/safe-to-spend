export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
  showIf?: (answers: Record<number, string>) => boolean;
}
