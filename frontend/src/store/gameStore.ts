import { create } from 'zustand';
import { IncomingChallenge } from '../types/challenge';
import { GameRoom, Question, GamePhase, ShapeCell } from '../types/game';

interface GameState {
  gameId: string | null;
  opponent: { id: string, username: string } | null;
  myScore: number;
  opponentScore: number;
  isGameOver: boolean;
  settings: {
    questions: number,
    language: string,
    gridSize: number,
  };
  
  // Active Match State
  currentQuestion: Question | null;
  lastQuestionStartTime: number | null; // Added question start timestamp
  currentQuestionIndex: number;
  currentPhase: GamePhase;
  timer: number;
  myPlacements: ShapeCell[]; 
  opponentBoardRevealed: { x: number, y: number, state: 'HIT' | 'MISS' }[];
  incomingChallenges: IncomingChallenge[];

  // Actions
  setGameId: (id: string | null) => void;
  setOpponent: (opponent: { id: string, username: string } | null) => void;
  setScores: (myScore: number, opponentScore: number) => void;
  setPhase: (phase: GamePhase) => void;
  setQuestion: (question: Question, index: number) => void;
  setTimer: (time: number) => void;
  setMyPlacements: (cells: ShapeCell[]) => void;
  revealOpponentCell: (x: number, y: number, hit: boolean) => void;
  setIncomingChallenges: (challenges: IncomingChallenge[]) => void;
  removeChallenge: (id: string) => void;
  setGameOver: (isGameOver: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  opponent: null,
  myScore: 0,
  opponentScore: 0,
  isGameOver: false,
  settings: {
    questions: 10,
    language: 'JavaScript',
    gridSize: 10,
  },
  
  currentQuestion: null,
  lastQuestionStartTime: null,
  currentQuestionIndex: 0,
  currentPhase: 'ACTIVE_QUIZ',
  timer: 60,
  myPlacements: [],
  opponentBoardRevealed: [],
  incomingChallenges: [],

  setGameId: (gameId) => set({ gameId }),
  setOpponent: (opponent) => set({ opponent }),
  setScores: (myScore, opponentScore) => set({ myScore, opponentScore }),
  setPhase: (currentPhase) => set({ currentPhase }),
  setQuestion: (currentQuestion, currentQuestionIndex) => set({ 
    currentQuestion, 
    currentQuestionIndex,
    lastQuestionStartTime: Date.now() // Track precisely when the question was shown
  }),
  setTimer: (timer) => set({ timer }),
  setMyPlacements: (myPlacements) => set({ myPlacements }),
  revealOpponentCell: (x, y, hit) => set((state) => ({
    opponentBoardRevealed: [...state.opponentBoardRevealed, { x, y, state: hit ? 'HIT' : 'MISS' }]
  })),
  setIncomingChallenges: (incomingChallenges) => set({ incomingChallenges }),
  removeChallenge: (id) => set((state) => ({ 
    incomingChallenges: state.incomingChallenges.filter(c => c.id !== id) 
  })),
  setGameOver: (isGameOver) => set({ isGameOver }),
  resetGame: () => set({ 
    gameId: null, opponent: null, myScore: 0, opponentScore: 0, 
    isGameOver: false, currentQuestion: null, lastQuestionStartTime: null, 
    currentQuestionIndex: 0, currentPhase: 'ACTIVE_QUIZ', timer: 60, 
    myPlacements: [], opponentBoardRevealed: [] 
  }),
}));
