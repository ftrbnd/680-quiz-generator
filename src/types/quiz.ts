export type QuizType =
  | "MULTIPLE_CHOICE"
  | "SHORT_ANSWER"
  | "FILL_IN_THE_BLANK"
  | "READING_COMPREHENSION";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type QuizVisibility = "SHARED" | "PRIVATE";

export interface QuizConfig {
  questionCount: number;
  quizType: QuizType;
  difficulty: Difficulty;
  timeLimitMinutes?: number;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  body: string;
  options?: QuestionOption[];
  correctAnswer: string;
  hasLatex: boolean;
  orderIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  ownerId: string;
  visibility: QuizVisibility;
  quizType: QuizType;
  difficulty: Difficulty;
  timeLimitMinutes?: number;
  createdAt: Date;
  questions: QuizQuestion[];
}

export interface AttemptResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  feedback: {
    question: QuizQuestion;
    studentResponse: string;
    isCorrect: boolean;
  }[];
}

export interface GenerateQuizRequest {
  fileId: string;
  config: QuizConfig;
}
