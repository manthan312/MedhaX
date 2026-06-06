import { Shape, PlacedShape } from './shapes.js';
import { Question } from '../data/questions.js';

export type MatchStatus = 'lobby' | 'placement' | 'question' | 'dig' | 'ended';

export interface MatchConfig {
  language: string;
  topics: string[];
  gridSize: 5 | 6 | 7;
  questionCount: number;
  gameMode?: 'grid';
}

export interface AnswerRecord {
  optionIndex: number;
  receivedAt: number; // epoch ms
}

export interface MatchState {
  matchId: string;
  players: string[];                                 // user IDs
  playerSockets: Record<string, string>;             // userId -> socketId
  status: MatchStatus;
  config: MatchConfig;
  placedShapes: Record<string, PlacedShape[]>;       // userId -> placed shapes
  placementLocked: Record<string, boolean>;          // userId -> locked?
  questions: Question[];
  currentQuestionIdx: number;
  answersThisRound: Record<string, AnswerRecord>;    // userId -> answer
  digTurnUserId: string | null;                      // who won this question round
  scores: Record<string, number>;                    // userId -> score
  attackedCells: Record<string, Set<string>>;        // userId -> Set<'r,c'> of THEIR grid that has been attacked
  timer: ReturnType<typeof setTimeout> | null;
  startedAt: number;
  disconnectTimers: Record<string, ReturnType<typeof setTimeout>>;
  readyPlayers: Set<string>;
  deadline?: number;

  shapeTemplates?: Record<string, Shape[]>;          // userId -> custom generated shapes
}

// ─── In-memory match store ────────────────────────────────────────────────────

// Expose globally for cross-module access (disconnect handler)
const matches: Map<string, MatchState> = new Map();
(globalThis as any).__medhax_matches = matches;

export function getMatch(matchId: string): MatchState | undefined {
  return matches.get(matchId);
}

export function deleteMatch(matchId: string): void {
  matches.delete(matchId);
}

export function getAllMatchIds(): string[] {
  return [...matches.keys()];
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createMatch(
  matchId: string,
  players: string[],
  config: MatchConfig,
): MatchState {
  const state: MatchState = {
    matchId,
    players,
    playerSockets: {},
    status: 'lobby',
    config,
    placedShapes: Object.fromEntries(players.map(p => [p, []])),
    placementLocked: Object.fromEntries(players.map(p => [p, false])),
    questions: [],
    currentQuestionIdx: 0,
    answersThisRound: {},
    digTurnUserId: null,
    scores: Object.fromEntries(players.map(p => [p, 0])),
    attackedCells: Object.fromEntries(players.map(p => [p, new Set<string>()])),
    timer: null,
    startedAt: Date.now(),
    disconnectTimers: {},
    readyPlayers: new Set(),

    shapeTemplates: {},
  };
  matches.set(matchId, state);
  return state;
}

// ─── Phase Transitions ────────────────────────────────────────────────────────

/**
 * Transition from lobby → placement.
 * Returns the deadline timestamp (ms since epoch) for the 90s placement timer.
 */
export function startPlacement(state: MatchState): number {
  state.status = 'placement';
  const deadline = Date.now() + 90_000;
  state.deadline = deadline;
  return deadline;
}

/**
 * Lock a player's placement.
 * Returns true if ALL players are now locked (placement complete).
 */
export function lockPlacement(
  state: MatchState,
  userId: string,
  shapes: PlacedShape[],
): boolean {
  state.placedShapes[userId] = shapes;
  state.placementLocked[userId] = true;
  return state.players.every(p => state.placementLocked[p]);
}

/**
 * Transition to question phase. Returns the deadline_ts for the 45s timer.
 */
export function startQuestion(state: MatchState): number {
  state.status = 'question';
  state.answersThisRound = {};
  state.digTurnUserId = null;
  const deadline = Date.now() + 45_000;
  state.deadline = deadline;
  return deadline;
}

/**
 * Record a player's answer. Returns true if all players have answered.
 * Idempotent — second calls for the same player are ignored.
 */
export function submitAnswer(
  state: MatchState,
  userId: string,
  optionIndex: number,
): boolean {
  if (state.answersThisRound[userId]) return allAnswered(state); // already answered
  state.answersThisRound[userId] = { optionIndex, receivedAt: Date.now() };
  return allAnswered(state);
}

function allAnswered(state: MatchState): boolean {
  return state.players.every(p => !!state.answersThisRound[p]);
}

export interface RoundResult {
  winnerId: string | null;  // null = tie / both wrong
  correctIndex: number;
  answers: Record<string, AnswerRecord>;
}

/**
 * Resolve the current question round.
 * Determines winner (fastest correct answer).
 * Awards a point to the winner and transitions state.
 */
export function resolveRound(state: MatchState): RoundResult {
  const q = state.questions[state.currentQuestionIdx];
  if (!q) throw new Error('No current question');

  const correctIndex = q.correct_index;

  // Find players who answered correctly
  const correctEntries = state.players
    .filter(p => state.answersThisRound[p]?.optionIndex === correctIndex)
    .map(p => ({ userId: p, record: state.answersThisRound[p]! }))
    .sort((a, b) => a.record.receivedAt - b.record.receivedAt); // fastest first

  const winnerId = correctEntries.length > 0 ? correctEntries[0]!.userId : null;

  if (winnerId) {
    state.scores[winnerId] = (state.scores[winnerId] ?? 0) + 1;
    state.digTurnUserId = winnerId;
    state.status = 'dig';
  } else {
    state.digTurnUserId = null;
    state.status = 'question'; // will advance question
  }

  state.currentQuestionIdx++;

  return { winnerId, correctIndex, answers: state.answersThisRound };
}

export interface DigResult {
  hit: boolean;
  cell: string;       // 'r,c'
  targetUserId: string;
  gameOver: boolean;
  remainingShipCells: number;
}

/**
 * Process a dig (attack) by `diggerUserId` targeting (`r`,`c`) on `targetUserId`'s grid.
 */
export function resolveDig(
  state: MatchState,
  diggerUserId: string,
  targetUserId: string,
  r: number,
  c: number,
): DigResult {
  const cellKey = `${r},${c}`;
  const targetShapes = state.placedShapes[targetUserId] ?? [];

  // Ensure attack set exists
  if (!state.attackedCells[targetUserId]) {
    state.attackedCells[targetUserId] = new Set();
  }
  state.attackedCells[targetUserId]!.add(cellKey);

  // Determine hit
  const hit = targetShapes.some(shape =>
    shape.cells.some(
      cell => shape.originR + cell.r === r && shape.originC + cell.c === c,
    ),
  );

  // Award dynamic points to the digger on a hit: (currentQuestionIdx [1-based] + 5)
  // currentQuestionIdx was already incremented in resolveRound, so it equals the 1-based question number
  if (hit) {
    const questionPoints = state.currentQuestionIdx + 5;
    state.scores[diggerUserId] = (state.scores[diggerUserId] ?? 0) + questionPoints;
  }

  // Count remaining unattacked ship cells
  const allShipCells = new Set<string>();
  for (const shape of targetShapes) {
    for (const cell of shape.cells) {
      allShipCells.add(`${shape.originR + cell.r},${shape.originC + cell.c}`);
    }
  }

  const remainingShipCells = [...allShipCells].filter(
    k => !state.attackedCells[targetUserId]!.has(k),
  ).length;

  const gameOver = remainingShipCells === 0;

  if (gameOver) {
    state.status = 'ended';
  } else {
    // Return to question phase after dig
    state.status = 'question';
  }

  return { hit, cell: cellKey, targetUserId, gameOver, remainingShipCells };
}

/**
 * End the match (time out or all questions exhausted).
 */
export function endMatch(
  state: MatchState,
): { winnerId: string | null; scores: Record<string, number> } {
  state.status = 'ended';
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }

  // Determine winner by score
  const [p1, p2] = state.players;
  const s1 = p1 ? (state.scores[p1] ?? 0) : -1;
  const s2 = p2 ? (state.scores[p2] ?? 0) : -1;

  let winnerId: string | null = null;
  if (s1 > s2) winnerId = p1 ?? null;
  else if (s2 > s1) winnerId = p2 ?? null;
  // tie → winnerId stays null

  return { winnerId, scores: state.scores };
}
