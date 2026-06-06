import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { submitAnswer, submitDig, requestHint, getSocket } from '../services/socket';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { MCQOption } from '../types/game';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'Game'>;

const { width } = Dimensions.get('window');

// ─── Animated Ring Timer ──────────────────────────────────────────────────────

const CircleTimer: React.FC<{ duration: number; timeLeft: number }> = ({ duration, timeLeft }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1 - timeLeft / duration,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  const pct = Math.max(0, Math.min(1, 1 - timeLeft / duration));
  const strokeDashoffset = circumference * pct;

  const color = timeLeft > 20 ? '#6366F1' : timeLeft > 8 ? '#F59E0B' : '#EF4444';

  return (
    <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle */}
      <View style={{
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 6, borderColor: '#1E293B',
        alignItems: 'center', justifyContent: 'center',
        position: 'absolute',
      }} />
      {/* Progress ring (simulated with a border arc) */}
      <View style={{
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 6,
        borderColor: color,
        borderTopColor: pct > 0.25 ? color : 'transparent',
        borderRightColor: pct > 0.5 ? color : 'transparent',
        borderBottomColor: pct > 0.75 ? color : 'transparent',
        borderLeftColor: color,
        position: 'absolute',
        transform: [{ rotate: `${pct * 360}deg` }],
      }} />
      <Text style={{ color, fontSize: 22, fontWeight: '900' }}>{timeLeft}</Text>
      <Text style={{ color: '#64748B', fontSize: 9, fontWeight: 'bold' }}>sec</Text>
    </View>
  );
};

// ─── MCQ Option Button ────────────────────────────────────────────────────────

type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'disabled';

const OptionButton: React.FC<{
  option: MCQOption;
  state: OptionState;
  onPress: () => void;
  index: number;
}> = ({ option, state, onPress, index }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'idle') {
      Animated.spring(bgAnim, { toValue: 1, useNativeDriver: false }).start();
    }
  }, [state]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const bgColor =
    state === 'correct' ? '#10B981' + '33' :
    state === 'wrong' ? '#EF4444' + '22' :
    state === 'selected' ? '#6366F1' + '22' :
    '#1E293B';

  const borderColor =
    state === 'correct' ? '#10B981' :
    state === 'wrong' ? '#EF4444' :
    state === 'selected' ? '#6366F1' :
    '#334155';

  const textColor =
    state === 'correct' ? '#10B981' :
    state === 'wrong' ? '#EF4444' :
    state === 'selected' ? '#A5B4FC' :
    '#CBD5E1';

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={state === 'disabled' || state === 'correct' || state === 'wrong' || state === 'selected'}
        style={{
          backgroundColor: bgColor,
          borderColor,
          borderWidth: 1.5,
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: borderColor + '33',
          borderWidth: 1, borderColor,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: borderColor, fontWeight: '900', fontSize: 13 }}>{labels[index]}</Text>
        </View>
        <Text style={{ color: textColor, flex: 1, fontWeight: '600', fontSize: 15 }}>{option.text}</Text>
        {state === 'correct' && <Text style={{ fontSize: 18 }}>✓</Text>}
        {state === 'wrong' && <Text style={{ fontSize: 18 }}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Mini Grid ────────────────────────────────────────────────────────────────

const MiniGrid: React.FC<{
  gridSize: number;
  myShips: Array<{ x: number; y: number }>;
  hits: Array<{ x: number; y: number; state: 'HIT' | 'MISS' }>;
  onCellPress?: (x: number, y: number) => void;
  isAttackGrid?: boolean;
  canDig?: boolean;
}> = ({ gridSize, myShips, hits, onCellPress, isAttackGrid, canDig }) => {
  const cellSize = Math.floor((width / 2 - 52) / gridSize);

  const getCell = (x: number, y: number) => {
    const hit = hits.find((h) => h.x === x && h.y === y);
    if (hit) return hit.state;
    if (!isAttackGrid && myShips.some((s) => s.x === x && s.y === y)) return 'SHIP';
    return 'EMPTY';
  };

  const cellColor = (state: string) => {
    if (state === 'HIT') return '#EF4444';
    if (state === 'MISS') return '#374151';
    if (state === 'SHIP') return '#6366F1';
    return '#1E293B';
  };

  return (
    <View style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#1E293B' }}>
      {Array.from({ length: gridSize }).map((_, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {Array.from({ length: gridSize }).map((_, x) => {
            const state = getCell(x, y);
            const tappable = isAttackGrid && canDig && state === 'EMPTY';
            return (
              <TouchableOpacity
                key={x}
                disabled={!tappable}
                onPress={() => onCellPress?.(x, y)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  margin: 1.5,
                  borderRadius: 4,
                  backgroundColor: cellColor(state),
                  borderWidth: tappable ? 1.5 : 0,
                  borderColor: tappable ? '#6366F1' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {state === 'HIT' && <Text style={{ fontSize: cellSize * 0.5, color: '#fff' }}>✕</Text>}
                {state === 'MISS' && <Text style={{ fontSize: cellSize * 0.5, color: '#64748B' }}>·</Text>}
                {tappable && <Text style={{ fontSize: cellSize * 0.4, color: '#6366F166' }}>◎</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info' }> = ({ message, type }) => {
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const colors = { success: '#10B981', error: '#EF4444', info: '#6366F1' };

  return (
    <Animated.View style={{
      transform: [{ translateY }],
      position: 'absolute', top: 8, left: 16, right: 16, zIndex: 999,
      backgroundColor: colors[type] + '22',
      borderColor: colors[type],
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
    }}>
      <Text style={{ color: colors[type], fontWeight: '900', fontSize: 14 }}>{message}</Text>
    </Animated.View>
  );
};

// ─── GameScreen ───────────────────────────────────────────────────────────────

const GameScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const { gameId } = route.params;
  const user = useAuthStore((s) => s.user);
  const { reportRapidSubmission } = useAntiCheat();

  const {
    currentQuestion,
    currentQuestionIndex,
    lastQuestionStartTime,
    config,
    myScore,
    opponentScore,
    opponent,
    myPlacements,
    opponentBoardRevealed,
    digTurn,
    timer,
    setTimer,
    myAnswered,
    answerQuestion,
    receiveDigResult,
    questionDeadline,
  } = useGameStore();

  const gridSize = config?.gridSize ?? 5;
  const totalQuestions = config?.totalQuestions ?? 10;
  const questionLimit = config?.questionTimeLimit ?? 45;

  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [answered, setAnswered] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreAnim = useRef(new Animated.Value(myScore)).current;
  const oppScoreAnim = useRef(new Animated.Value(opponentScore)).current;
  const digBannerAnim = useRef(new Animated.Value(0)).current;

  // ── Reset per question ────────────────────────────────────────────────────
  useEffect(() => {
    setOptionStates({});
    setAnswered(false);
    setWaitingForOpponent(false);

    if (!questionDeadline) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const msLeft = Math.max(0, questionDeadline - Date.now());
      const secs = Math.ceil(msLeft / 1000);
      setTimer(secs);
      if (msLeft <= 0) {
        clearInterval(timerRef.current!);
        if (!useGameStore.getState().myAnswered) {
          showToast("⏱ Time's up!", 'info');
          setAnswered(true);
          setWaitingForOpponent(true);
        }
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestion?.id, questionDeadline]);

  // ── Score animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(scoreAnim, { toValue: myScore, duration: 600, useNativeDriver: false }).start();
  }, [myScore]);

  useEffect(() => {
    Animated.timing(oppScoreAnim, { toValue: opponentScore, duration: 600, useNativeDriver: false }).start();
  }, [opponentScore]);

  // ── Dig banner animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (digTurn) {
      Animated.spring(digBannerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(digBannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [digTurn]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAnswer = useCallback(async (option: MCQOption) => {
    if (answered || !currentQuestion) return;

    const timeToAnswer = lastQuestionStartTime ? Date.now() - lastQuestionStartTime : 9999;
    reportRapidSubmission(timeToAnswer);
    setAnswered(true);
    answerQuestion();

    // Optimistic: mark as selected
    setOptionStates((prev) => ({ ...prev, [option.id]: 'selected' }));

    submitAnswer({
      matchId: gameId,
      questionId: currentQuestion.id,
      answer: option.id,
      timeToAnswerMs: timeToAnswer,
    });

    setWaitingForOpponent(true);

    // Listen for answer result from socket (handled in useSocket → gameStore)
    // We handle state update via useEffect on receiveAnswerResult
  }, [answered, currentQuestion, gameId, lastQuestionStartTime]);

  // ── Listen to answer.result to update option states ──────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setWaitingForOpponent(false);

      // Update option states
      const newStates: Record<string, OptionState> = {};
      currentQuestion?.options?.forEach((o) => {
        if (o.id === payload.correctAnswer) newStates[o.id] = 'correct';
        else if (answered && o.id !== payload.correctAnswer) newStates[o.id] = 'wrong';
        else newStates[o.id] = 'disabled';
      });
      setOptionStates(newStates);

      if (payload.correct && payload.firstCorrect) {
        showToast('🎯 FIRST CORRECT! You earned a DIG TURN!', 'success');
      } else if (payload.correct) {
        showToast('✓ Correct!', 'success');
      } else {
        showToast('✗ Wrong answer', 'error');
      }
    };

    socket.on('answer.result', handler);
    return () => { socket.off('answer.result', handler); };
  }, [currentQuestion, answered]);

  const handleDig = useCallback((x: number, y: number) => {
    if (!digTurn) return;
    submitDig({ matchId: gameId, x, y });
    showToast('💥 Dig sent!', 'info');
  }, [digTurn, gameId]);

  const handleHint = () => {
    if (currentQuestion) {
      requestHint({ matchId: gameId, questionId: currentQuestion.id });
    }
  };

  // Fallback options if none provided
  const options: MCQOption[] = currentQuestion?.options ?? [
    { id: 'a', text: 'Option A' },
    { id: 'b', text: 'Option B' },
    { id: 'c', text: 'Option C' },
    { id: 'd', text: 'Option D' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-slate-500 text-xs uppercase tracking-widest">Round</Text>
            <Text className="text-white font-black text-lg">
              {currentQuestionIndex + 1} / {totalQuestions}
            </Text>
          </View>

          {/* Scoreboard */}
          <View className="bg-slate-800 rounded-2xl px-5 py-2 border border-slate-700 flex-row items-center gap-4">
            <View className="items-center">
              <Text className="text-indigo-400 text-xs font-bold">YOU</Text>
              <Animated.Text style={{ color: '#6366F1', fontWeight: '900', fontSize: 22 }}>
                {myScore}
              </Animated.Text>
            </View>
            <Text className="text-slate-700 font-black">:</Text>
            <View className="items-center">
              <Text className="text-red-400 text-xs font-bold">{opponent?.username?.toUpperCase() ?? 'OPP'}</Text>
              <Animated.Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 22 }}>
                {opponentScore}
              </Animated.Text>
            </View>
          </View>

          {/* Timer ring */}
          <CircleTimer duration={questionLimit} timeLeft={timer} />
        </View>

        {/* ── Question Panel ── */}
        <View className="px-5 mb-4">
          <View className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700/60">
            {/* Language badge */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 rounded-full">
                <Text className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                  {currentQuestion?.language ?? 'Code'}
                </Text>
              </View>
              {/* Hint button */}
              <TouchableOpacity onPress={handleHint} className="flex-row items-center gap-1 opacity-70">
                <Text className="text-amber-400 text-xs">💡 Hint</Text>
              </TouchableOpacity>
            </View>

            {/* Question text */}
            <Text className="text-white text-base font-semibold leading-6 mb-4">
              {currentQuestion?.text ?? 'Loading question…'}
            </Text>

            {/* Code snippet */}
            {currentQuestion?.snippet && (
              <View className="bg-slate-900 rounded-xl p-3 mb-4 border border-slate-700">
                <Text className="text-indigo-200 font-mono text-sm leading-5">
                  {currentQuestion.snippet}
                </Text>
              </View>
            )}

            {/* Options */}
            {options.map((option, i) => (
              <OptionButton
                key={option.id}
                option={option}
                index={i}
                state={optionStates[option.id] ?? (answered ? 'disabled' : 'idle')}
                onPress={() => handleAnswer(option)}
              />
            ))}

            {/* Waiting indicator */}
            {waitingForOpponent && (
              <View className="flex-row items-center justify-center gap-2 mt-3">
                <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-70" />
                <Text className="text-slate-500 text-sm italic">Waiting for opponent…</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Dig Turn Banner ── */}
        <Animated.View style={{
          opacity: digBannerAnim,
          transform: [{ scale: digBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          marginHorizontal: 20,
          marginBottom: 12,
        }}>
          <View style={{ backgroundColor: '#6366F122', borderColor: '#6366F188', borderWidth: 2, borderRadius: 16, padding: 14, alignItems: 'center' }}>
            <Text className="text-indigo-300 font-black text-base">🎯 DIG TURN — Tap Opponent Grid!</Text>
            <Text className="text-indigo-500 text-xs mt-1">Select a cell to attack</Text>
          </View>
        </Animated.View>

        {/* ── Dual Grid ── */}
        <View className="px-5 mb-8">
          <View className="flex-row gap-3">
            {/* My Grid */}
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-2 text-center">My Board</Text>
              <MiniGrid
                gridSize={gridSize}
                myShips={myPlacements}
                hits={opponentBoardRevealed.map((h) => ({ ...h, state: h.state as 'HIT' | 'MISS' }))}
                isAttackGrid={false}
              />
            </View>

            {/* VS divider */}
            <View className="items-center justify-center px-1">
              <View className="bg-slate-800 rounded-full w-8 h-8 items-center justify-center border border-slate-700">
                <Text className="text-slate-600 text-[9px] font-black">VS</Text>
              </View>
            </View>

            {/* Opponent Grid */}
            <View className="flex-1">
              <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-2 text-center">
                {digTurn ? '🎯 TARGET' : "Opponent's Board"}
              </Text>
              <MiniGrid
                gridSize={gridSize}
                myShips={[]}
                hits={opponentBoardRevealed.map((h) => ({ ...h, state: h.state as 'HIT' | 'MISS' }))}
                onCellPress={handleDig}
                isAttackGrid
                canDig={digTurn}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GameScreen;
