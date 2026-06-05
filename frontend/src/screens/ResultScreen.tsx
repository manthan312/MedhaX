import React, { useEffect, useRef, useState } from 'react';
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
import { gameService } from '../services/gameService';
import { GameResult } from '../types/game';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'Result'>;

const { width } = Dimensions.get('window');

// ─── Animated Star (Confetti-like) ───────────────────────────────────────────

interface StarProps {
  x: number;
  delay: number;
  color: string;
  size: number;
}

const Star: React.FC<StarProps> = ({ x, delay, color, size }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: 300 + Math.random() * 200, duration: 1800, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 3 + Math.random() * 5, duration: 1800, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const rotateStr = rotate.interpolate({ inputRange: [0, 6.28], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        fontSize: size,
        opacity,
        color,
        transform: [{ translateY }, { rotate: rotateStr }],
        zIndex: 100,
      }}>
      ★
    </Animated.Text>
  );
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ label: string; value: number; maxValue: number; color: string }> = ({
  label, value, maxValue, color,
}) => {
  const barWidth = useRef(new Animated.Value(0)).current;
  const pct = maxValue > 0 ? value / maxValue : 0;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: pct,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barW = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-400 text-xs font-bold">{label}</Text>
        <Text style={{ color }} className="text-xs font-black">{value}</Text>
      </View>
      <View className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <Animated.View style={{ width: barW, height: '100%', backgroundColor: color, borderRadius: 99 }} />
      </View>
    </View>
  );
};

// ─── Stat Tile ────────────────────────────────────────────────────────────────

const StatTile: React.FC<{ label: string; value: string; color?: string; emoji?: string }> = ({
  label, value, color = 'text-white', emoji,
}) => (
  <View className="flex-1 bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 items-center m-1">
    {emoji && <Text className="text-2xl mb-1">{emoji}</Text>}
    <Text className={`text-2xl font-black ${color}`}>{value}</Text>
    <Text className="text-slate-500 text-[10px] uppercase tracking-widest mt-1 text-center">{label}</Text>
  </View>
);

// ─── ResultScreen ─────────────────────────────────────────────────────────────

const ResultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const { gameId } = route.params;
  const user = useAuthStore((s) => s.user);
  const { opponent, matchResult, resetGame } = useGameStore();

  const [result, setResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Entrance animations
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(60)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Stars
  const [stars] = useState(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      x: Math.random() * (width - 20),
      delay: i * 120,
      color: ['#F59E0B', '#6366F1', '#10B981', '#EC4899', '#06B6D4'][i % 5],
      size: 14 + Math.random() * 14,
    }))
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await gameService.getGameResult(gameId);
        setResult(data);
      } catch {
        // Use mock
        setResult({
          winnerId: user?.id ?? '',
          myScore: 1200,
          opponentScore: 850,
          stats: { accuracy: 0.82, attempts: 10, avgResponseTime: 4200, digHits: 4 },
          antiCheatSummary: 'Clear',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [gameId]);

  useEffect(() => {
    if (!isLoading && result) {
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(contentSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [isLoading, result]);

  const isWinner = result ? (result.winnerId === user?.id) : false;
  const isDraw = result ? (result.myScore === result.opponentScore) : false;

  const handleHome = () => {
    resetGame();
    navigation.navigate('Home');
  };

  const handleRematch = () => {
    navigation.navigate('Lobby', { friendId: opponent?.id });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-4xl mb-4">⚙️</Text>
        <Text className="text-white font-black text-xl">Calculating Results…</Text>
      </View>
    );
  }

  const winColor = isWinner ? '#10B981' : isDraw ? '#6366F1' : '#EF4444';
  const winEmoji = isWinner ? '🏆' : isDraw ? '🤝' : '💀';
  const winLabel = isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT';
  const winSub = isWinner ? 'You dominated the grid!' : isDraw ? 'Legendary battle.' : 'Better luck next time!';

  const maxScore = Math.max(result?.myScore ?? 0, result?.opponentScore ?? 1);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      {/* ── Stars animation (winner only) ── */}
      {isWinner && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, pointerEvents: 'none', zIndex: 100 }}>
          {stars.map((s, i) => <Star key={i} {...s} />)}
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Badge ── */}
        <View className="items-center pt-12 pb-6">
          <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
            <View
              style={{
                width: 130,
                height: 130,
                borderRadius: 65,
                backgroundColor: winColor + '22',
                borderColor: winColor,
                borderWidth: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: winColor,
                shadowOpacity: 0.6,
                shadowRadius: 30,
                elevation: 20,
              }}>
              <Text style={{ fontSize: 56 }}>{winEmoji}</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
            <Text style={{ color: winColor, fontSize: 36, fontWeight: '900', marginTop: 16, textAlign: 'center', letterSpacing: -0.5 }}>
              {winLabel}
            </Text>
            <Text className="text-slate-400 text-center mt-2 text-base">{winSub}</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
          {/* ── Score Comparison ── */}
          <View className="mx-5 mb-6 bg-slate-800/80 rounded-3xl p-6 border border-slate-700/50">
            <View className="flex-row items-center justify-between">
              <View className="items-center flex-1">
                <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">You</Text>
                <Text style={{ color: winColor, fontSize: 42, fontWeight: '900' }}>{result?.myScore}</Text>
                <Text className="text-slate-600 text-xs">pts</Text>
              </View>

              <View className="items-center px-4">
                <Text className="text-slate-700 font-black text-xl italic">VS</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-2">
                  {opponent?.username?.toUpperCase() ?? 'OPP'}
                </Text>
                <Text className="text-white text-4xl font-black">{result?.opponentScore}</Text>
                <Text className="text-slate-600 text-xs">pts</Text>
              </View>
            </View>

            {/* Timeline bars */}
            <View className="mt-6 pt-4 border-t border-slate-700/50">
              <Text className="text-slate-500 text-xs uppercase tracking-widest mb-4">Score Breakdown</Text>
              <ScoreBar label="Your Score" value={result?.myScore ?? 0} maxValue={maxScore} color={winColor} />
              <ScoreBar label={`${opponent?.username ?? 'Opponent'}'s Score`} value={result?.opponentScore ?? 0} maxValue={maxScore} color="#EF4444" />
            </View>
          </View>

          {/* ── Stats Grid ── */}
          <View className="mx-5 mb-6">
            <Text className="text-white font-black text-lg mb-4">📊 Match Stats</Text>
            <View className="flex-row flex-wrap">
              <StatTile
                label="Accuracy"
                value={`${Math.round((result?.stats.accuracy ?? 0) * 100)}%`}
                color="text-emerald-400"
                emoji="🎯"
              />
              <StatTile
                label="Questions"
                value={`${result?.stats.attempts ?? 0}`}
                color="text-indigo-400"
                emoji="📝"
              />
              <StatTile
                label="Avg Response"
                value={`${((result?.stats.avgResponseTime ?? 0) / 1000).toFixed(1)}s`}
                color="text-amber-400"
                emoji="⚡"
              />
              <StatTile
                label="Dig Hits"
                value={`${result?.stats.digHits ?? 0}`}
                color="text-rose-400"
                emoji="💣"
              />
            </View>
          </View>

          {/* ── Fair Play ── */}
          {result?.antiCheatSummary && (
            <View className="mx-5 mb-6">
              <View style={{
                backgroundColor: result.antiCheatSummary === 'Clear' ? '#10B981' + '15' : '#F59E0B' + '15',
                borderColor: result.antiCheatSummary === 'Clear' ? '#10B981' + '50' : '#F59E0B' + '50',
                borderWidth: 1,
                borderRadius: 16,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
                <Text className="text-lg">{result.antiCheatSummary === 'Clear' ? '✅' : '⚠️'}</Text>
                <View>
                  <Text className="text-white font-bold text-sm">Fair Play Status</Text>
                  <Text style={{ color: result.antiCheatSummary === 'Clear' ? '#10B981' : '#F59E0B' }} className="text-sm font-black">
                    {result.antiCheatSummary}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View className="mx-5 mb-12 gap-4">
            <TouchableOpacity
              onPress={handleRematch}
              style={{ borderColor: '#6366F1', borderWidth: 1.5 }}
              className="bg-slate-800 rounded-2xl py-5 items-center">
              <Text className="text-white font-black text-lg">⚔️ Rematch</Text>
              <Text className="text-slate-500 text-xs mt-0.5">Challenge same opponent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleHome}
              style={{ shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }}
              className="bg-indigo-600 rounded-2xl py-5 items-center">
              <Text className="text-white font-black text-lg">🏠 Back to Home</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResultScreen;
