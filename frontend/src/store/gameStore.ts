import { create } from 'zustand';
import {
  MatchStatus,
  MatchConfig,
  Question,
  AnswerResult,
  DigResult,
  MatchResult,
  PlayerInfo,
  GridCell,
  ShapeCell,
  Placement,
} from '../types/game';
import { IncomingChallenge } from '../types/challenge';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface GameState {
  // Match metadata
  matchId: string | null;
  status: MatchStatus;
  players: PlayerInfo[];
  config: MatchConfig;

  // My board
  myShapes: Placement[];          // shapes I've placed
  myGrid: GridCell[];             // all cells on my board (ships + hits received)

  // Opponent board (what I've attacked)
  opponentGrid: GridCell[];

  // Active question
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  lastQuestionStartTime: number | null;
  myAnswered: boolean;
  hints: string[];

  // Scores
  scores: Record<string, number>; // playerId -> score

  // Timer (seconds remaining)
  timer: number;
  placementDeadline: number | null;
  questionDeadline: number | null;

  // Dig phase
  digTurn: boolean;               // true when it's my turn to dig
  digResult: DigResult | null;

  // End of match
  matchResult: MatchResult | null;

  // Legacy fields for backward compat with existing components
  gameId: string | null;
  opponent: { id: string; username: string } | null;
  myScore: number;
  opponentScore: number;
  isGameOver: boolean;
  settings: { questions: number; language: string; gridSize: number };
  currentPhase: string;
  myPlacements: ShapeCell[];
  opponentBoardRevealed: { x: number; y: number; state: 'HIT' | 'MISS' }[];
  incomingChallenges: IncomingChallenge[];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface GameActions {
  setMatchConfig: (matchId: string, config: MatchConfig, players: PlayerInfo[]) => void;
  setStatus: (status: MatchStatus) => void;
  updatePlayers: (players: PlayerInfo[]) => void;
  setMyShapes: (shapes: Placement[]) => void;
  receiveQuestion: (question: Question, index: number) => void;
  answerQuestion: () => void;
  receiveAnswerResult: (result: AnswerResult) => void;
  setDigTurn: (active: boolean) => void;
  receiveDigResult: (result: DigResult, isMyDig: boolean) => void;
  updateScores: (scores: Record<string, number>) => void;
  addHint: (hint: string) => void;
  setTimer: (t: number) => void;
  setPlacementDeadline: (ts: number | null) => void;
  setQuestionDeadline: (ts: number | null) => void;
  endMatch: (result: MatchResult) => void;
  resetGame: () => void;

  // Legacy actions (backward compat)
  setGameId: (id: string | null) => void;
  setOpponent: (opponent: { id: string; username: string } | null) => void;
  setScores: (myScore: number, opponentScore: number) => void;
  setPhase: (phase: string) => void;
  setQuestion: (question: Question, index: number) => void;
  setMyPlacements: (cells: ShapeCell[]) => void;
  revealOpponentCell: (x: number, y: number, hit: boolean) => void;
  setIncomingChallenges: (challenges: IncomingChallenge[]) => void;
  removeChallenge: (id: string) => void;
  setGameOver: (isGameOver: boolean) => void;
  setSettings: (settings: { questions: number; language: string; gridSize?: number }) => void;
}

// ─── Default Config ───────────────────────────────────────────────────────────

const defaultConfig: MatchConfig = {
  gridSize: 5,
  totalQuestions: 10,
  language: 'JavaScript',
  topics: [],
  questionTimeLimit: 45,
  placementTimeLimit: 90,
};

const defaultState: GameState = {
  matchId: null,
  status: 'waiting',
  players: [],
  config: defaultConfig,

  myShapes: [],
  myGrid: [],
  opponentGrid: [],

  currentQuestion: null,
  currentQuestionIndex: 0,
  lastQuestionStartTime: null,
  myAnswered: false,
  hints: [],

  scores: {},
  timer: 45,
  placementDeadline: null,
  questionDeadline: null,

  digTurn: false,
  digResult: null,
  matchResult: null,

  // Legacy
  gameId: null,
  opponent: null,
  myScore: 0,
  opponentScore: 0,
  isGameOver: false,
  settings: { questions: 10, language: 'JavaScript', gridSize: 5 },
  currentPhase: 'ACTIVE_QUIZ',
  myPlacements: [],
  opponentBoardRevealed: [],
  incomingChallenges: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...defaultState,

  // ── New Actions ──────────────────────────────────────────────────────────

  setMatchConfig: (matchId, config, players) => {
    const scores: Record<string, number> = {};
    players.forEach((p) => { scores[p.id] = 0; });
    set({ matchId, config, players, scores, gameId: matchId, settings: { questions: config.totalQuestions, language: config.language, gridSize: config.gridSize } });
  },

  setStatus: (status) => set({ status }),

  updatePlayers: (players) => set({ players }),

  setMyShapes: (shapes) => {
    const myGrid: GridCell[] = shapes.flatMap((p) =>
      p.cells.map((c) => ({ x: c.x, y: c.y, state: 'MY_SHIP' as const }))
    );
    set({ myShapes: shapes, myGrid, myPlacements: shapes.flatMap((p) => p.cells) });
  },

  receiveQuestion: (question, index) =>
    set({
      currentQuestion: question,
      currentQuestionIndex: index,
      lastQuestionStartTime: Date.now(),
      myAnswered: false,
      hints: [],
      digTurn: false,
      digResult: null,
      currentPhase: 'ACTIVE_QUIZ',
    }),

  answerQuestion: () => set({ myAnswered: true }),

  receiveAnswerResult: (result) => {
    const scores = { ...get().scores };
    // Update scores if provided
    set({
      myScore: result.myScore,
      opponentScore: result.opponentScore,
      currentPhase: result.firstCorrect && result.correct ? 'DIG_MODE' : 'RESOLVED',
    });
  },

  setDigTurn: (active) => set({ digTurn: active, currentPhase: active ? 'DIG_MODE' : get().currentPhase }),

  receiveDigResult: (result, isMyDig) => {
    set((state) => {
      if (isMyDig) {
        const opponentGrid = [...state.opponentGrid];
        const idx = opponentGrid.findIndex((c) => c.x === result.x && c.y === result.y);
        const cell: GridCell = { x: result.x, y: result.y, state: result.hit ? 'REVEALED_HIT' : 'REVEALED_MISS' };
        if (idx >= 0) opponentGrid[idx] = cell;
        else opponentGrid.push(cell);
        return { digResult: result, opponentGrid, digTurn: false, currentPhase: 'COOLDOWN', opponentBoardRevealed: [...state.opponentBoardRevealed, { x: result.x, y: result.y, state: result.hit ? 'HIT' : 'MISS' }] };
      } else {
        // Opponent dug my board
        const myGrid = [...state.myGrid];
        const idx = myGrid.findIndex((c) => c.x === result.x && c.y === result.y);
        const newState = result.hit ? 'REVEALED_HIT' as const : 'REVEALED_MISS' as const;
        if (idx >= 0) myGrid[idx] = { ...myGrid[idx], state: newState };
        else myGrid.push({ x: result.x, y: result.y, state: newState });
        return { myGrid };
      }
    });
  },

  updateScores: (scores) => {
    const state = get();
    // Try to identify myScore and opponentScore from scores map
    const myId = state.players.find((p) => !p.id.includes('opp'))?.id;
    const oppId = state.players.find((p) => p.id !== myId)?.id;
    const myScore = myId ? (scores[myId] ?? state.myScore) : state.myScore;
    const opponentScore = oppId ? (scores[oppId] ?? state.opponentScore) : state.opponentScore;
    set({ scores, myScore, opponentScore });
  },

  addHint: (hint) => set((state) => ({ hints: [...state.hints, hint] })),

  setTimer: (t) => set({ timer: t }),

  setPlacementDeadline: (ts) => set({ placementDeadline: ts }),
  setQuestionDeadline: (ts) => set({ questionDeadline: ts }),

  endMatch: (matchResult) =>
    set({
      matchResult,
      status: 'completed',
      isGameOver: true,
      currentPhase: 'ENDED',
    }),

  resetGame: () => set(defaultState),

  // ── Legacy Actions (Backward Compat) ─────────────────────────────────────

  setGameId: (gameId) => set({ gameId, matchId: gameId }),
  setOpponent: (opponent) => set({ opponent }),
  setScores: (myScore, opponentScore) => set({ myScore, opponentScore }),
  setPhase: (currentPhase) => set({ currentPhase }),
  setQuestion: (currentQuestion, currentQuestionIndex) =>
    set({ currentQuestion, currentQuestionIndex, lastQuestionStartTime: Date.now() }),
  setMyPlacements: (myPlacements) => set({ myPlacements }),
  revealOpponentCell: (x, y, hit) =>
    set((state) => ({
      opponentBoardRevealed: [
        ...state.opponentBoardRevealed,
        { x, y, state: hit ? 'HIT' : 'MISS' },
      ],
    })),
  setIncomingChallenges: (incomingChallenges) => set({ incomingChallenges }),
  removeChallenge: (id) =>
    set((state) => ({
      incomingChallenges: state.incomingChallenges.filter((c) => c.id !== id),
    })),
  setGameOver: (isGameOver) => set({ isGameOver }),
  setSettings: (s) =>
    set({
      settings: { questions: s.questions, language: s.language, gridSize: s.gridSize ?? 5 },
      config: { ...get().config, totalQuestions: s.questions, language: s.language, gridSize: s.gridSize ?? 5 },
    }),
}));
