export interface ShapeCell {
  x: number;
  y: number;
}

export interface ShapeTemplate {
  id: string;
  name: string;
  cells: ShapeCell[];
}

export interface Placement {
  shapeId: string;
  anchor: ShapeCell;
  cells: ShapeCell[];
}

export type GamePhase =
  | 'LOBBY'
  | 'PLACEMENT'
  | 'ACTIVE_QUIZ'
  | 'RESOLVED'
  | 'DIG_MODE'
  | 'COOLDOWN'
  | 'ENDED';

export type MatchStatus =
  | 'waiting'
  | 'placement'
  | 'active'
  | 'completed';

export interface MCQOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  snippet?: string;
  language: string;
  options?: MCQOption[];
}

export type CellState = 'HIDDEN' | 'REVEALED_HIT' | 'REVEALED_MISS' | 'MY_SHIP';

export interface GridCell {
  x: number;
  y: number;
  state: CellState;
}

export interface AnswerResult {
  questionId: string;
  correct: boolean;
  firstCorrect: boolean;
  correctAnswer: string;
  myScore: number;
  opponentScore: number;
}

export interface DigResult {
  x: number;
  y: number;
  hit: boolean;
  shapeId?: string;
}

export interface PlayerInfo {
  id: string;
  username: string;
  avatar?: string;
  elo?: number;
  ready: boolean;
  locked?: boolean;
  isOnline?: boolean;
}

export interface MatchConfig {
  gridSize: number;
  totalQuestions: number;
  language: string;
  topics: string[];
  questionTimeLimit: number;
  placementTimeLimit: number;
}

export interface MatchResult {
  winnerId: string | null;
  isDraw: boolean;
  players: {
    id: string;
    username: string;
    score: number;
    correctAnswers: number;
    digHits: number;
    digMisses: number;
    accuracy: number;
    avgResponseTime: number;
    scoreTimeline: number[];
    revealedShapes: ShapeCell[][];
  }[];
}

export interface GameResult {
  winnerId: string;
  myScore: number;
  opponentScore: number;
  stats: {
    accuracy: number;
    attempts: number;
    avgResponseTime: number;
    digHits: number;
  };
  antiCheatSummary?: string;
}

export interface GameRoom {
  id: string;
  opponent: {
    id: string;
    username: string;
  };
  status: 'pending' | 'active' | 'completed';
  settings: {
    questions: number;
    language: string;
    gridSize?: number;
  };
  createdAt: string;
}
