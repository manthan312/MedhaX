import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useFriendStore } from '../store/friendStore';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import { Question, AnswerResult, DigResult, MatchResult, PlayerInfo, MatchConfig, Placement } from '../types/game';
import { FriendRequest } from '../store/friendStore';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// ─── Server → Client event payloads ──────────────────────────────────────────

interface PresenceUpdatePayload {
  userId: string;
  isOnline: boolean;
}

interface LobbyUpdatePayload {
  matchId: string;
  players: PlayerInfo[];
  config: MatchConfig;
}

interface PlacementStartPayload {
  matchId?: string;
  deadline_ts?: number;
  remainingSeconds?: number;
  config: MatchConfig;
  shapes: Array<{ id: string; name: string; cells: Array<{ x: number; y: number }> }>;
}

interface QuestionStartPayload {
  question: Question;
  index: number;
  timer?: number;
  remainingSeconds?: number;
  deadline_ts?: number;
}

interface AnswerResultPayload extends AnswerResult {}

interface DigTurnPayload {
  matchId: string;
  playerId: string; // whose turn it is
}

interface DigResultPayload extends DigResult {
  attackerId: string;
}

interface MatchStatePayload {
  matchId: string;
  scores: Record<string, number>;
  players: PlayerInfo[];
}

interface MatchEndPayload {
  result: MatchResult;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSocket = () => {
  const { isAuthenticated, token, user } = useAuthStore();
  const {
    setMatchConfig,
    setStatus,
    updatePlayers,
    receiveQuestion,
    receiveAnswerResult,
    setDigTurn,
    receiveDigResult,
    updateScores,
    endMatch,
    setIncomingChallenges,
    setTimer,
  } = useGameStore();
  const { setFriendOnline, addIncomingRequest } = useFriendStore();
  const navigation = useNavigation<NavigationProp>();
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Initialize socket if needed
    const socket = initSocket(token);

    if (listenersAttached.current) return;
    listenersAttached.current = true;

    // ── Presence ────────────────────────────────────────────────────────────
    socket.on('presence.update', (payload: PresenceUpdatePayload) => {
      setFriendOnline(payload.userId, payload.isOnline);
    });

    // ── Lobby ────────────────────────────────────────────────────────────────
    socket.on('lobby.update', (payload: LobbyUpdatePayload) => {
      setMatchConfig(payload.matchId, payload.config, payload.players);
      updatePlayers(payload.players);
    });

    // ── Placement phase start ─────────────────────────────────────────────────
    socket.on('placement.start', (payload: PlacementStartPayload) => {
      setStatus('placement');
      const store = useGameStore.getState();
      const matchId = payload.matchId || store.matchId || '';
      const remSecs = payload.remainingSeconds ?? 90;
      store.setPlacementDeadline(Date.now() + remSecs * 1000);
      store.setGameId(matchId);
      navigation.navigate('ShapePlacement', { gameId: matchId });
    });

    // ── Question start ────────────────────────────────────────────────────────
    socket.on('question.start', (payload: QuestionStartPayload) => {
      receiveQuestion(payload.question, payload.index);
      const remSecs = payload.remainingSeconds ?? payload.timer ?? 45;
      const localDl = Date.now() + remSecs * 1000;
      useGameStore.getState().setQuestionDeadline(localDl);
      setTimer(remSecs);
      const matchId = useGameStore.getState().matchId;
      navigation.navigate('Game', { gameId: matchId ?? '' });
    });

    // ── Answer result ─────────────────────────────────────────────────────────
    socket.on('answer.result', (payload: AnswerResultPayload) => {
      receiveAnswerResult(payload);
      updateScores({});
    });

    // ── Dig turn ──────────────────────────────────────────────────────────────
    socket.on('dig.turn', (payload: DigTurnPayload) => {
      const isMyTurn = payload.playerId === user?.id;
      setDigTurn(isMyTurn);
    });

    // ── Dig result ────────────────────────────────────────────────────────────
    socket.on('dig.result', (payload: DigResultPayload) => {
      const isMyDig = payload.attackerId === user?.id;
      receiveDigResult(
        { x: payload.x, y: payload.y, hit: payload.hit, shapeId: payload.shapeId },
        isMyDig
      );
    });

    // ── Match state sync ──────────────────────────────────────────────────────
    socket.on('match.state', (payload: MatchStatePayload) => {
      updateScores(payload.scores);
      updatePlayers(payload.players);
    });

    // ── Match end ─────────────────────────────────────────────────────────────
    socket.on('match.end', (payload: MatchEndPayload) => {
      endMatch(payload.result);
      const matchId = useGameStore.getState().matchId;
      navigation.navigate('Result', { gameId: matchId ?? '' });
    });

    // ── Friend notifications ──────────────────────────────────────────────────
    socket.on('friend.request', (request: FriendRequest) => {
      addIncomingRequest(request);
    });

    socket.on('friend.accepted', (payload: { userId: string; username: string }) => {
      console.log('[Socket] Friend accepted:', payload.username);
    });

    // ── Challenge events (legacy) ────────────────────────────────────────────
    socket.on('challenge_received', (newChallenge) => {
      const currentChallenges = useGameStore.getState().incomingChallenges;
      setIncomingChallenges([newChallenge, ...currentChallenges]);
    });

    socket.on('challenge_accepted', (payload) => {
      console.log('[Socket] Challenge accepted by opponent:', payload);
      if (payload?.gameId) {
        navigation.navigate('ShapePlacement', { gameId: payload.gameId });
      }
    });

    // ── Disconnect handling ───────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log('[useSocket] Disconnected:', reason);
      listenersAttached.current = false;
    });

    socket.on('reconnect', () => {
      console.log('[useSocket] Reconnected');
    });

    return () => {
      const s = getSocket();
      if (s) {
        s.off('presence.update');
        s.off('lobby.update');
        s.off('placement.start');
        s.off('question.start');
        s.off('answer.result');
        s.off('dig.turn');
        s.off('dig.result');
        s.off('match.state');
        s.off('match.end');
        s.off('friend.request');
        s.off('friend.accepted');
        s.off('challenge_received');
        s.off('challenge_accepted');
        s.off('disconnect');
        s.off('reconnect');
      }
      listenersAttached.current = false;
    };
  }, [isAuthenticated, token]);
};
