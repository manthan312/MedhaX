// ─── Socket.io Match Event Handler ───────────────────────────────────────────
import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  MatchState,
  createMatch,
  getMatch,
  deleteMatch,
  startPlacement,
  lockPlacement,
  startQuestion,
  submitAnswer,
  resolveRound,
  resolveDig,
  endMatch,
} from '../game/matchState.js';
import {
  PlacedShape,
  placeShapes,
  isValidPlacement,
  generateShapesForGrid,
} from '../game/shapes.js';
import { pickQuestions } from '../data/questions.js';
import { getGeminiKey } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';
import { onlineUsers } from '../config/online.js';

// ─── Types for socket payloads ────────────────────────────────────────────────

interface JoinLobbyPayload {
  matchId: string;
  userId: string;
  config: {
    language: string;
    topics: string[];
    gridSize: 5 | 6 | 7;
    questionCount: number;
    gameMode?: 'grid' | 'snippets';
  };
}

interface PlacementLockPayload {
  matchId: string;
  userId: string;
  shapes: PlacedShape[];
}

interface AnswerSubmitPayload {
  matchId: string;
  userId: string;
  optionIndex: number;
}

interface DigSubmitPayload {
  matchId: string;
  userId: string;
  targetUserId: string;
  r: number;
  c: number;
}

interface HintRequestPayload {
  matchId: string;
  userId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEMENT_TIMEOUT_MS = 90_000;
const QUESTION_TIMEOUT_MS  = 45_000;
const RECONNECT_GRACE_MS   = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function clearMatchTimer(state: MatchState): void {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

/** Broadcast to all players in a match via their socket IDs. */
function emitToMatch(io: Server, state: MatchState, event: string, data: unknown): void {
  for (const uid of state.players) {
    const sid = state.playerSockets[uid];
    if (sid) io.to(sid).emit(event, data);
  }
}

/** Validate client-supplied shapes against the server grid logic. */
export function validateClientShapes(shapes: PlacedShape[], gridSize: number): boolean {
  const grid: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false),
  );
  for (const shape of shapes) {
    if (!isValidPlacement(shape, shape.originR, shape.originC, grid, gridSize)) {
      return false;
    }
    for (const cell of shape.cells) {
      const gr = shape.originR + cell.r;
      const gc = shape.originC + cell.c;
      if (grid[gr]) grid[gr]![gc] = true;
    }
  }
  return true;
}

async function getPlayerHandles(state: MatchState): Promise<Record<string, string>> {
  try {
    const { data: users } = await supabaseAdmin.database
      .from('users')
      .select('id, handle')
      .in('id', state.players);
    const map: Record<string, string> = {};
    for (const u of users || []) {
      map[u.id] = u.handle;
    }
    return map;
  } catch (err) {
    console.error('[getPlayerHandles] failed:', err);
    return {};
  }
}

/** Persist match result to the database. */
async function persistMatchResult(state: MatchState, winnerId: string | null): Promise<void> {
  try {
    await supabaseAdmin.database.from('matches').insert([
      {
        id: state.matchId,
        language: state.config.language,
        topics: state.config.topics,
        grid_size: state.config.gridSize,
        winner_id: winnerId,
        started_at: new Date(state.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        rounds_played: state.currentQuestionIdx,
      },
    ]);

    const playerInserts = state.players.map(userId => ({
      match_id: state.matchId,
      user_id: userId,
      final_score: state.scores[userId] ?? 0,
      response_stats: {}
    }));
    await supabaseAdmin.database.from('match_players').insert(playerInserts);
  } catch (err) {
    console.error('[matchSocket] Failed to persist match result:', err);
  }
}

/** Get a Gemini-generated hint for the current question. */
async function generateHint(questionPrompt: string, choices: string[]): Promise<string> {
  const choiceText = choices.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const prompt = `You are a coding tutor. Give a concise 1-2 sentence hint (no direct answer) for this question:\n\nQuestion: ${questionPrompt}\nChoices:\n${choiceText}\n\nHint:`;

  // We rotate keys if one fails
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const key = getGeminiKey();
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err: any) {
      console.warn(`[matchSocket] generateHint attempt ${attempt + 1} failed:`, err.message || err);
      if (attempt === 3) {
        throw err;
      }
    }
  }
  return "Think about the logic of the code flow and check the variable mutations.";
}

/** Fetch user handles and emit lobby updates to clients. */
async function emitLobbyUpdate(io: Server, state: MatchState): Promise<void> {
  try {
    const { data: users } = await supabaseAdmin.database
      .from('users')
      .select('id, handle')
      .in('id', state.players);

    const playersWithHandles = state.players.map(pid => {
      const u = users?.find((user: any) => user.id === pid);
      return {
        id: pid,
        handle: u?.handle || 'Unknown Coder',
      };
    });

    emitToMatch(io, state, 'lobby.update', {
      creatorId: state.creatorId,
      players: playersWithHandles,
      readyPlayers: [...state.readyPlayers],
      status: state.status,
      config: state.config,
    });
  } catch (err) {
    console.error('[emitLobbyUpdate]', err);
  }
}

/** Get all active matches from the global registry (populated in matchState.ts). */
function getAllMatches(): Map<string, MatchState> {
  return (globalThis as any).__medhax_matches ?? new Map<string, MatchState>();
}

// ─── Phase Helpers ────────────────────────────────────────────────────────────

export function advanceToQuestion(io: Server, matchId: string): void {
  const state = getMatch(matchId);
  if (!state) return;

  if (state.currentQuestionIdx >= state.questions.length) {
    const endResult = endMatch(state);
    emitToMatch(io, state, 'match.end', {
      winnerId: endResult.winnerId,
      scores: endResult.scores,
      reason: 'questions_exhausted',
    });
    persistMatchResult(state, endResult.winnerId);
    deleteMatch(matchId);
    return;
  }

  const deadline = startQuestion(state);
  const q = state.questions[state.currentQuestionIdx];

  emitToMatch(io, state, 'question.start', {
    questionIdx: state.currentQuestionIdx,
    total: state.questions.length,
    question: {
      id: q?.id,
      prompt: q?.prompt,
      choices: q?.choices,
      language: q?.language,
      topic: q?.topic,
      difficulty: q?.difficulty,
    },
    deadline_ts: deadline,
    remainingSeconds: 45,
  });

  // 45-second auto-resolve timer
  state.timer = setTimeout(() => {
    const s = getMatch(matchId);
    if (!s || s.status !== 'question') return;
    resolveAndBroadcastRound(io, matchId, s);
  }, QUESTION_TIMEOUT_MS);
}

function resolveAndBroadcastRound(io: Server, matchId: string, state: MatchState): void {
  clearMatchTimer(state);

  const result = resolveRound(state);

  emitToMatch(io, state, 'answer.result', {
    winnerId: result.winnerId,
    correctIndex: result.correctIndex,
    answers: result.answers,
    scores: state.scores,
  });

  if (result.winnerId) {
    // Let the winner choose a cell to dig
    emitToMatch(io, state, 'dig.turn', {
      diggerUserId: result.winnerId,
      targetPlayers: state.players.filter(p => p !== result.winnerId),
      gridSize: state.config.gridSize,
    });
  } else {
    // No winner this round — brief pause then next question
    setTimeout(() => advanceToQuestion(io, matchId), 2000);
  }
}

function handleDisconnect(
  io: Server,
  matchId: string,
  state: MatchState,
  disconnectedUserId: string,
): void {
  console.log(`[disconnect] ${disconnectedUserId} from match ${matchId}`);

  emitToMatch(io, state, 'presence.update', {
    userId: disconnectedUserId,
    gracePeriodMs: RECONNECT_GRACE_MS,
  });

  // Start grace-period countdown
  state.disconnectTimers[disconnectedUserId] = setTimeout(() => {
    const s = getMatch(matchId);
    if (!s) return;

    // If still no socket after grace period, forfeit
    if (!s.playerSockets[disconnectedUserId]) {
      const opponent = s.players.find(p => p !== disconnectedUserId) ?? null;
      const endResult = endMatch(s);

      emitToMatch(io, s, 'match.end', {
        winnerId: opponent,
        scores: endResult.scores,
        reason: 'opponent_disconnected',
      });

      persistMatchResult(s, opponent);
      deleteMatch(matchId);
    }
  }, RECONNECT_GRACE_MS);
}

// ─── Main Socket Handler ──────────────────────────────────────────────────────

export function registerMatchHandlers(io: Server, socket: Socket): void {
  const socketUserId: string = (socket as any).userId;

  // ── challenge.send ─────────────────────────────────────────────────────────
  socket.on('challenge.send', async (payload: { matchId: string; targetUserId: string }) => {
    const { matchId, targetUserId } = payload;
    const senderUserId = socketUserId;

    if (!targetUserId) return;

    try {
      const { data: userRecord } = await supabaseAdmin.database
        .from('users')
        .select('handle')
        .eq('id', senderUserId)
        .maybeSingle();

      const senderHandle = (userRecord as any)?.handle || 'A player';

      const match = getMatch(matchId);
      if (match) {
        match.challengedUserIds.add(targetUserId);
      }
      
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('challenge.received', {
            matchId,
            senderId: senderUserId,
            senderHandle,
            config: match?.config
          });
        }
      }
    } catch (err) {
      console.error('[challenge.send] error:', err);
    }
  });

  // ── challenge.decline ──────────────────────────────────────────────────────
  socket.on('challenge.decline', (payload: { matchId: string; targetUserId: string; declinerHandle: string }) => {
    const { targetUserId, declinerHandle } = payload;
    const targetSockets = onlineUsers.get(targetUserId);
    if (targetSockets) {
      for (const socketId of targetSockets) {
        io.to(socketId).emit('challenge.declined', {
          declinerHandle,
        });
      }
    }
  });

  // ── join_lobby ─────────────────────────────────────────────────────────────
  socket.on('lobby.join', async (payload: JoinLobbyPayload) => {
    const { matchId, config } = payload;
    const joiningUserId = payload.userId || socketUserId;

    let state = getMatch(matchId);

    if (!state) {
      state = createMatch(matchId, [joiningUserId], config);
    } else if (!state.players.includes(joiningUserId)) {
      if (state.players.length >= 2) {
        socket.emit('error', { message: 'Match is full' });
        return;
      }
      state.players.push(joiningUserId);
      state.scores[joiningUserId] = 0;
      state.attackedCells[joiningUserId] = new Set();
      state.placedShapes[joiningUserId] = [];
      state.placementLocked[joiningUserId] = false;
    }

    // Handle reconnect: cancel disconnect timer if any
    if (state.disconnectTimers[joiningUserId]) {
      clearTimeout(state.disconnectTimers[joiningUserId]);
      delete state.disconnectTimers[joiningUserId];
      emitToMatch(io, state, 'presence.update', { userId: joiningUserId, status: 'reconnected' });
    }

    state.playerSockets[joiningUserId] = socket.id;
    socket.join(matchId);

    emitLobbyUpdate(io, state);

    if (state.status === 'placement') {
      const remainingSeconds = state.deadline ? Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)) : 90;
      const handles = await getPlayerHandles(state);
      if (!state.shapeTemplates) {
        state.shapeTemplates = {};
      }
      if (!state.shapeTemplates[joiningUserId]) {
        state.shapeTemplates[joiningUserId] = generateShapesForGrid(state.config.gridSize);
      }
      socket.emit('placement.start', {
        deadline_ts: state.deadline || (Date.now() + 90_000),
        remainingSeconds,
        gridSize: state.config.gridSize,
        players: state.players,
        playerHandles: handles,
        config: state.config,
        shapesTemplates: state.shapeTemplates[joiningUserId],
        placementLocked: state.placementLocked,
      });
    } else if (state.status === 'question') {
      const q = state.questions[state.currentQuestionIdx];
      if (q) {
        const remainingSeconds = state.deadline ? Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)) : 45;
        const handles = await getPlayerHandles(state);
        socket.emit('question.start', {
          questionIdx: state.currentQuestionIdx,
          total: state.questions.length,
          question: {
            id: q.id,
            prompt: q.prompt,
            choices: q.choices,
            language: q.language,
            topic: q.topic,
            difficulty: q.difficulty,
          },
          deadline_ts: state.deadline || (Date.now() + 45_000),
          remainingSeconds,
          playerHandles: handles,
        });
      }
    } else if (state.status === 'dig') {
      const handles = await getPlayerHandles(state);
      socket.emit('dig.turn', {
        diggerUserId: state.digTurnUserId,
        targetPlayers: state.players.filter(p => p !== state.digTurnUserId),
        gridSize: state.config.gridSize,
        playerHandles: handles,
      });
    }

    console.log(`[join_lobby] ${joiningUserId} joined match ${matchId} in state ${state.status}`);
  });

  // ── lobby.update_config ────────────────────────────────────────────────────
  socket.on('lobby.update_config', async (payload: { matchId: string; config: JoinLobbyPayload['config'] }) => {
    const { matchId, config } = payload;
    const state = getMatch(matchId);
    if (!state || state.status !== 'lobby') return;

    state.config = {
      language: config.language,
      topics: config.topics,
      gridSize: config.gridSize,
      questionCount: config.questionCount,
      gameMode: config.gameMode,
    };

    emitLobbyUpdate(io, state);

    // Push updated challenge config to pending invited friends
    const senderUserId = state.creatorId;
    if (senderUserId) {
      try {
        const { data } = await supabaseAdmin.database.from('users').select('handle').eq('id', senderUserId).maybeSingle();
        const senderHandle = (data as any)?.handle || 'A player';
        state.challengedUserIds.forEach(targetUserId => {
          const targetSockets = onlineUsers.get(targetUserId);
          if (targetSockets) {
            for (const socketId of targetSockets) {
              io.to(socketId).emit('challenge.received', {
                matchId,
                senderId: senderUserId,
                senderHandle,
                config: state.config
              });
            }
          }
        });
      } catch (err) {
        console.error('[lobby.update_config] error updating challenge:', err);
      }
    }
  });

  // ── player_ready ───────────────────────────────────────────────────────────
  socket.on('lobby.ready', async (payload: { matchId: string; userId: string; language?: string; topics?: string[] }) => {
    const { matchId, language, topics } = payload;
    const readyUserId = payload.userId || socketUserId;

    const state = getMatch(matchId);
    if (!state || state.status !== 'lobby') return;

    state.readyPlayers.add(readyUserId);

    if (!state.config) {
      state.config = {
        language: 'JavaScript',
        topics: [],
        gridSize: 5,
        questionCount: 10,
      };
    }

    if (language) {
      state.config.language = language;
    }
    if (topics && Array.isArray(topics)) {
      state.config.topics = topics;
    }

    emitLobbyUpdate(io, state);

    // Start when both players are ready
    if (
      state.players.length === 2 &&
      state.players.every(p => state.readyPlayers.has(p))
    ) {
      // Pick questions from the bank
      state.questions = await pickQuestions(
        state.config.language,
        state.config.topics,
        state.config.questionCount,
        state.config.gameMode
      );

      const deadline = startPlacement(state);
      const handles = await getPlayerHandles(state);

      // Generate a UNIQUE set of shape templates for each player
      // (so both players have the same total coverage ratio but possibly different shapes)
      if (!state.shapeTemplates) state.shapeTemplates = {};
      for (const pid of state.players) {
        state.shapeTemplates[pid] = generateShapesForGrid(state.config.gridSize);
      }

      // Emit placement.start individually per player so each gets their own shapesTemplates
      for (const pid of state.players) {
        const sid = state.playerSockets[pid];
        if (sid) {
          io.to(sid).emit('placement.start', {
            deadline_ts: deadline,
            remainingSeconds: 90,
            gridSize: state.config.gridSize,
            players: state.players,
            playerHandles: handles,
            config: state.config,
            shapesTemplates: state.shapeTemplates[pid],
            placementLocked: state.placementLocked,
          });
        }
      }

      // Auto-force placement lock after 90s
      state.timer = setTimeout(() => {
        const s = getMatch(matchId);
        if (!s || s.status !== 'placement') return;

        // Auto-place for any player who hasn't locked yet.
        // Reuse the templates that were sent to the player at placement start.
        if (!s.shapeTemplates) s.shapeTemplates = {};
        for (const pid of s.players) {
          if (!s.placementLocked[pid]) {
            // Use the player's original templates so coverage is guaranteed correct
            const templates = s.shapeTemplates[pid] ?? generateShapesForGrid(s.config.gridSize);
            const placed = placeShapes(templates, s.config.gridSize);
            lockPlacement(s, pid, placed);
          }
        }

        clearMatchTimer(s);
        advanceToQuestion(io, matchId);
      }, PLACEMENT_TIMEOUT_MS);
    }
  });

  // ── placement_lock ─────────────────────────────────────────────────────────
  socket.on('placement.lock', (payload: PlacementLockPayload) => {
    const { matchId, shapes } = payload;
    const lockingUserId = payload.userId || socketUserId;

    const state = getMatch(matchId);
    if (!state || state.status !== 'placement') {
      socket.emit('error', { message: 'Not in placement phase' });
      return;
    }

    if (state.placementLocked[lockingUserId]) {
      socket.emit('error', { message: 'Already locked' });
      return;
    }

    // Server-side validation: check no overlaps and all cells are within grid
    if (!validateClientShapes(shapes, state.config.gridSize)) {
      socket.emit('placement_invalid', { message: 'Invalid shape placement — shapes overlap or are out of bounds' });
      return;
    }

    // Strict cell-count check: total cells placed must match the templates sent to this player
    const templates = state.shapeTemplates?.[lockingUserId];
    if (templates) {
      const expectedCells = templates.reduce((sum, t) => sum + t.cells.length, 0);
      const actualCells = shapes.reduce((sum, s) => sum + s.cells.length, 0);
      if (actualCells !== expectedCells) {
        socket.emit('placement_invalid', {
          message: `Placement must cover exactly ${expectedCells} cells (your grid requires ${expectedCells} cells). You placed ${actualCells}.`,
        });
        return;
      }
    }

    const allLocked = lockPlacement(state, lockingUserId, shapes);
    emitToMatch(io, state, 'placement.locked', { userId: lockingUserId });

    if (allLocked) {
      clearMatchTimer(state);
      advanceToQuestion(io, matchId);
    }
  });

  // ── answer_submit ──────────────────────────────────────────────────────────
  socket.on('answer.submit', (payload: AnswerSubmitPayload) => {
    const { matchId, optionIndex } = payload;
    const answerUserId = payload.userId || socketUserId;

    const state = getMatch(matchId);
    if (!state || state.status !== 'question') {
      socket.emit('error', { message: 'Not in question phase' });
      return;
    }

    if (state.answersThisRound[answerUserId]) {
      socket.emit('error', { message: 'Already answered this round' });
      return;
    }

    // Check if this answer is correct — if so, resolve immediately (lockout opponent)
    const currentQuestion = state.questions[state.currentQuestionIdx];
    const isCorrect = currentQuestion && optionIndex === currentQuestion.correct_index;

    submitAnswer(state, answerUserId, optionIndex);
    socket.emit('answer_acknowledged', { userId: answerUserId });

    if (isCorrect) {
      // ⚡ Fast-correct-answer lockout: resolve immediately — opponent cannot answer anymore
      clearMatchTimer(state);
      resolveAndBroadcastRound(io, matchId, state);
    } else {
      // Wrong answer — opponent can still answer; wait for them or the timer
      const allAnswered = state.players.every(p => !!state.answersThisRound[p]);
      if (allAnswered) {
        resolveAndBroadcastRound(io, matchId, state);
      }
    }
  });

  // ── dig_submit ─────────────────────────────────────────────────────────────
  socket.on('dig.submit', (payload: DigSubmitPayload) => {
    const { matchId, targetUserId, r, c } = payload;
    const diggerUserId = payload.userId || socketUserId;

    const state = getMatch(matchId);
    if (!state || state.status !== 'dig') {
      socket.emit('error', { message: 'Not in dig phase' });
      return;
    }

    if (state.digTurnUserId !== diggerUserId) {
      socket.emit('error', { message: 'Not your dig turn' });
      return;
    }

    if (!state.players.includes(targetUserId) || targetUserId === diggerUserId) {
      socket.emit('error', { message: 'Invalid target player' });
      return;
    }

    if (r < 0 || r >= state.config.gridSize || c < 0 || c >= state.config.gridSize) {
      socket.emit('error', { message: 'Cell coordinates out of bounds' });
      return;
    }

    const result = resolveDig(state, diggerUserId, targetUserId, r, c);

    emitToMatch(io, state, 'dig.result', {
      diggerUserId,
      targetUserId,
      r,
      c,
      hit: result.hit,
      gameOver: result.gameOver,
      remainingShipCells: result.remainingShipCells,
      scores: state.scores,
    });

    if (result.gameOver) {
      const endResult = endMatch(state);
      emitToMatch(io, state, 'match.end', {
        winnerId: endResult.winnerId,
        scores: endResult.scores,
        reason: 'all_ships_sunk',
      });
      persistMatchResult(state, endResult.winnerId);
      deleteMatch(matchId);
      return;
    }

    // Check if all questions exhausted
    if (state.currentQuestionIdx >= state.questions.length) {
      const endResult = endMatch(state);
      emitToMatch(io, state, 'match.end', {
        winnerId: endResult.winnerId,
        scores: endResult.scores,
        reason: 'questions_exhausted',
      });
      persistMatchResult(state, endResult.winnerId);
      deleteMatch(matchId);
      return;
    }

    advanceToQuestion(io, matchId);
  });

  // ── request_hint ───────────────────────────────────────────────────────────
  socket.on('hint.request', async (payload: HintRequestPayload) => {
    const { matchId } = payload;

    const state = getMatch(matchId);
    if (!state || state.status !== 'question') {
      socket.emit('error', { message: 'Hints only available during question phase' });
      return;
    }

    const q = state.questions[state.currentQuestionIdx];
    if (!q) {
      socket.emit('error', { message: 'No active question' });
      return;
    }

    try {
      const hint = await generateHint(q.prompt, [...q.choices]);
      socket.emit('hint_response', { hint, questionId: q.id });
    } catch (err: any) {
      console.error('[request_hint] Gemini error:', err?.message ?? err);
      socket.emit('hint_response', {
        hint: 'Hint unavailable right now — trust your instincts!',
        questionId: q.id,
      });
    }
  });

  // ── match.forfeit ──────────────────────────────────────────────────────────
  socket.on('match.forfeit', (payload: { matchId: string; userId: string; reason?: string }) => {
    const { matchId, userId, reason } = payload;
    const state = getMatch(matchId);
    if (!state) return;

    const opponent = state.players.find(p => p !== userId) ?? null;
    const endResult = endMatch(state);

    emitToMatch(io, state, 'match.end', {
      winnerId: opponent,
      scores: endResult.scores,
      reason: reason || 'forfeit',
    });

    persistMatchResult(state, opponent);
    deleteMatch(matchId);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const allMatches = getAllMatches();

    for (const [matchId, state] of allMatches) {
      // Find this socket's user in the match
      for (const uid of state.players) {
        if (state.playerSockets[uid] === socket.id) {
          // Clear the socket reference
          delete state.playerSockets[uid];
          handleDisconnect(io, matchId, state, uid);
          return; // each socket can only be in one match
        }
      }
    }
  });
}
