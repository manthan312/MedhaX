import { create } from 'zustand';

export type GameStatus = 'idle' | 'lobby' | 'placement' | 'question' | 'dig' | 'ended';

export interface PlacedShape {
  id: string;
  name: string;
  cells: { r: number; c: number }[];
  originR: number;
  originC: number;
}

export interface Question {
  id: string;
  prompt: string;
  choices: string[];
  language: string;
  topic: string;
  difficulty: string;
}

export interface GridCell {
  hasShape: boolean;
  attacked: boolean;
  hit: boolean;
}

interface GameState {
  matchId: string | null;
  status: GameStatus;
  players: string[];
  opponentId: string | null;
  config: { language: string; topics: string[]; gridSize: number; questionCount: number; gameMode?: 'grid' | 'tictactoe' } | null;
  myShapes: PlacedShape[];
  myGrid: GridCell[][];
  opponentGrid: GridCell[][];
  currentQuestion: Question | null;
  questionIdx: number;
  totalQuestions: number;
  deadline_ts: number | null;
  scores: Record<string, number>;
  myAnswered: boolean;
  answerResult: { correctIndex: number; winnerId: string | null } | null;
  digTurn: string | null;
  matchResult: { winnerId: string | null; scores: Record<string, number>; reason: string } | null;
  hint: string | null;
  readyPlayers: string[];
  placementDeadline: number | null;
  opponentLocked: boolean;
  playerHandles: Record<string, string>;


  setMatchId: (id: string) => void;
  setStatus: (s: GameStatus) => void;
  setPlayers: (players: string[], opponentId: string) => void;
  setConfig: (config: GameState['config']) => void;
  setMyShapes: (shapes: PlacedShape[]) => void;
  initGrids: (size: number) => void;
  receiveQuestion: (q: Question, idx: number, total: number, deadline: number) => void;
  setMyAnswered: (v: boolean) => void;
  setAnswerResult: (r: GameState['answerResult']) => void;
  setDigTurn: (uid: string | null) => void;
  markDigResult: (r: number, c: number, hit: boolean, isMyGrid: boolean) => void;
  updateScores: (scores: Record<string, number>) => void;
  setMatchResult: (r: GameState['matchResult']) => void;
  setHint: (h: string | null) => void;
  setReadyPlayers: (players: string[]) => void;
  setPlacementDeadline: (ts: number) => void;
  setOpponentLocked: (v: boolean) => void;
  setPlayerHandles: (map: Record<string, string>) => void;

  reset: () => void;
}

const makeGrid = (size: number): GridCell[][] =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ hasShape: false, attacked: false, hit: false }))
  );

export const useGameStore = create<GameState>((set) => ({
  matchId: null, status: 'idle', players: [], opponentId: null, config: null,
  myShapes: [], myGrid: makeGrid(5), opponentGrid: makeGrid(5),
  currentQuestion: null, questionIdx: 0, totalQuestions: 0, deadline_ts: null,
  scores: {}, myAnswered: false, answerResult: null, digTurn: null, matchResult: null,
  hint: null, readyPlayers: [], placementDeadline: null, opponentLocked: false,
  playerHandles: {},
 
  setMatchId: (id) => set({ matchId: id }),
  setStatus: (s) => set({ status: s }),
  setPlayers: (players, opponentId) => set({ players, opponentId }),
  setConfig: (config) => set({ config }),
  setMyShapes: (myShapes) => set({ myShapes }),
  initGrids: (size) => set({ myGrid: makeGrid(size), opponentGrid: makeGrid(size) }),
  receiveQuestion: (currentQuestion, questionIdx, totalQuestions, deadline_ts) =>
    set({ currentQuestion, questionIdx, totalQuestions, deadline_ts, myAnswered: false, answerResult: null, digTurn: null, hint: null }),
  setMyAnswered: (v) => set({ myAnswered: v }),
  setAnswerResult: (r) => set({ answerResult: r }),
  setDigTurn: (uid) => set({ digTurn: uid }),
  markDigResult: (r, c, hit, isMyGrid) => set((state) => {
    const grid = isMyGrid ? state.myGrid.map(row => [...row]) : state.opponentGrid.map(row => [...row]);
    if (grid[r]) grid[r]![c] = { ...grid[r]![c]!, attacked: true, hit };
    return isMyGrid ? { myGrid: grid } : { opponentGrid: grid };
  }),
  updateScores: (scores) => set({ scores }),
  setMatchResult: (r) => set({ matchResult: r, status: 'ended' }),
  setHint: (h) => set({ hint: h }),
  setReadyPlayers: (readyPlayers) => set({ readyPlayers }),
  setPlacementDeadline: (ts) => set({ placementDeadline: ts }),
  setOpponentLocked: (v) => set({ opponentLocked: v }),
  setPlayerHandles: (playerHandles) => set({ playerHandles }),

  reset: () => set({
    matchId: null, status: 'idle', players: [], opponentId: null, config: null,
    myShapes: [], myGrid: makeGrid(5), opponentGrid: makeGrid(5),
    currentQuestion: null, questionIdx: 0, totalQuestions: 0, deadline_ts: null,
    scores: {}, myAnswered: false, answerResult: null, digTurn: null, matchResult: null,
    hint: null, readyPlayers: [], placementDeadline: null, opponentLocked: false,
    playerHandles: {},
  }),
}));
