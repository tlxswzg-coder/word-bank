export interface WordItem {
  id: number;
  word: string;
  translation: string;
  category: string;
  emoji: string;
}

export interface QuizState {
  isActive: boolean;
  score: number;
  currentQuestionIndex: number;
  options: string[]; // List of Chinese translations
  lastAnswerCorrect: boolean | null;
}

export enum GameMode {
  LEARN = 'LEARN',
  QUIZ = 'QUIZ'
}