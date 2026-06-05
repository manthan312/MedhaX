import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useFriendStore } from '../store/friendStore';
import { gameService } from '../services/gameService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

// ─── Animated Counter ─────────────────────────────────────────────────────────

const AnimatedCounter: React.FC<{ value: number; color?: string }> = ({ value, color = 'text-white' }) => {
  const animVal = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();
    const listener = animVal.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });
    return () => animVal.removeListener(listener);
  }, [value]);

  return <Text className={`text-3xl font-black ${color}`}>{display}</Text>;
};

// ─── Rank Badge ───────────────────────────────────────────────────────────────

const RankBadge: React.FC<{ elo: number }> = ({ elo }) => {
  const getRank = (elo: number) => {
    if (elo >= 2000) return { label: 'GRANDMASTER', color: '#FF6B6B', emoji: '👑' };
    if (elo >= 1800) return { label: 'MASTER', color: '#A855F7', emoji: '💎' };
    if (elo >= 1600) return { label: 'PLATINUM', color: '#06B6D4', emoji: '🔷' };
    if (elo >= 1400) return { label: 'GOLD', color: '#F59E0B', emoji: '⭐' };
    if (elo >= 1200) return { label: 'SILVER', color: '#94A3B8', emoji: '🥈' };
    return { label: 'BRONZE', color: '#CD7F32', emoji: '🥉' };
  };
  const rank = getRank(elo);
  return (
    <View style={{ backgroundColor: rank.color + '22', borderColor: rank.color + '66', borderWidth: 1 }}
      className="flex-row items-center px-3 py-1 rounded-full gap-1">
      <Text className="text-sm">{rank.emoji}</Text>
      <Text style={{ color: rank.color }} className="text-xs font-black tracking-widest">{rank.label}</Text>
    </View>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: number; color?: string; suffix?: string }> = ({
  label, value, color = 'text-white', suffix = '',
}) => (
  <View className="flex-1 bg-slate-800/80 rounded-2xl p-4 items-center border border-slate-700/50">
    <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">{label}</Text>
    <View className="flex-row items-baseline">
      <AnimatedCounter value={value} color={color} />
      {suffix ? <Text className={`${color} text-lg font-bold ml-0.5`}>{suffix}</Text> : null}
    </View>
  </View>
);

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

const LeaderboardRow: React.FC<{ rank: number; username: string; elo: number; isMe?: boolean }> = ({
  rank, username, elo, isMe,
}) => {
  const rankColors = ['#F59E0B', '#94A3B8', '#CD7F32'];
  const rankEmojis = ['🥇', '🥈', '🥉'];
  return (
    <View
      style={{ backgroundColor: isMe ? '#6366F1' + '22' : undefined, borderColor: isMe ? '#6366F1' + '55' : '#1E293B' }}
      className="flex-row items-center py-3 px-4 rounded-2xl mb-2 border">
      <View className="w-8 items-center">
        {rank <= 3 ? (
          <Text className="text-lg">{rankEmojis[rank - 1]}</Text>
        ) : (
          <Text style={{ color: rankColors[rank - 1] ?? '#64748B' }} className="text-sm font-black">#{rank}</Text>
        )}
      </View>
      <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mx-3">
        <Text className="text-white font-black text-sm">{username[0].toUpperCase()}</Text>
      </View>
      <Text className={`flex-1 font-bold ${isMe ? 'text-indigo-300' : 'text-white'}`}>{username}</Text>
      <View className="bg-indigo-500/20 px-3 py-1 rounded-full">
        <Text className="text-indigo-400 font-black text-sm">{elo}</Text>
      </View>
    </View>
  );
};

// ─── Recent Match Card ────────────────────────────────────────────────────────

const RecentMatchCard: React.FC<{
  opponent: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  myScore: number;
  oppScore: number;
  language: string;
}> = ({ opponent, result, myScore, oppScore, language }) => {
  const colors = { WIN: '#10B981', LOSS: '#EF4444', DRAW: '#6366F1' };
  const labels = { WIN: 'Victory', LOSS: 'Defeat', DRAW: 'Draw' };
  return (
    <View className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 mb-3 flex-row items-center">
      <View
        style={{ backgroundColor: colors[result] + '22', borderColor: colors[result] + '55', borderWidth: 1 }}
        className="w-16 h-16 rounded-xl items-center justify-center mr-4">
        <Text style={{ color: colors[result] }} className="font-black text-xs">{labels[result]}</Text>
        <Text className="text-2xl mt-1">{result === 'WIN' ? '🏆' : result === 'LOSS' ? '💀' : '🤝'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold">vs {opponent}</Text>
        <Text className="text-slate-500 text-xs mt-0.5">{language}</Text>
        <Text className="text-slate-400 text-sm mt-1">
          <Text style={{ color: colors[result] }} className="font-black">{myScore}</Text>
          <Text className="text-slate-600"> — </Text>
          <Text className="text-slate-400 font-bold">{oppScore}</Text>
        </Text>
      </View>
    </View>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { incomingChallenges, setIncomingChallenges, removeChallenge, setGameId, setOpponent, setSettings } = useGameStore();
  const { fetchFriends, friends } = useFriendStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(-60)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;
  const leaderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(headerAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(statsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(leaderAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await gameService.getIncomingChallenges();
      setIncomingChallenges(data);
    } catch { /* silent */ }
    try { await fetchFriends(); } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleAccept = async (id: string) => {
    try {
      const gameRoom = await gameService.acceptChallenge(id);
      setGameId(gameRoom.id);
      setOpponent(gameRoom.opponent);
      setSettings(gameRoom.settings);
      navigation.navigate('ShapePlacement', { gameId: gameRoom.id });
    } catch {
      Alert.alert('Match Error', 'Could not accept the challenge at this time.');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await gameService.declineChallenge(id);
      removeChallenge(id);
    } catch {
      Alert.alert('Error', 'Failed to decline challenge.');
    }
  };

  // Mock stats — replace with real user stats API
  const stats = { wins: 18, losses: 6, streak: 4, elo: 1540 };

  // Mock leaderboard
  const leaderboard = [
    { id: '1', username: 'CodeNinja', elo: 2100 },
    { id: '2', username: 'ByteMaster', elo: 1980 },
    { id: '3', username: 'AlgoKing', elo: 1870 },
    { id: '4', username: user?.username ?? 'You', elo: stats.elo },
    { id: '5', username: 'DevWizard', elo: 1450 },
  ];

  // Mock recent matches
  const recentMatches = [
    { opponent: 'ByteMaster', result: 'WIN' as const, myScore: 1200, oppScore: 850, language: 'Python' },
    { opponent: 'AlgoKing', result: 'LOSS' as const, myScore: 700, oppScore: 1100, language: 'JavaScript' },
    { opponent: 'DevWizard', result: 'WIN' as const, myScore: 950, oppScore: 600, language: 'Java' },
  ];

  const onlineFriends = friends.filter((f) => f.isOnline);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {/* ── Header ── */}
        <Animated.View style={{ transform: [{ translateY: headerAnim }] }}>
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-row items-center gap-4">
                {/* Avatar */}
                <View
                  style={{ shadowColor: '#6366F1', shadowOpacity: 0.5, shadowRadius: 12 }}
                  className="w-14 h-14 rounded-2xl bg-indigo-600 items-center justify-center border-2 border-indigo-400">
                  <Text className="text-white text-2xl font-black">
                    {user?.username?.[0]?.toUpperCase() ?? 'P'}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-400 text-sm">Welcome back,</Text>
                  <Text className="text-white text-xl font-black">@{user?.username ?? 'Player'}</Text>
                  <View className="mt-1">
                    <RankBadge elo={stats.elo} />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => Alert.alert('Logout', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout },
                ])}
                className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <Text className="text-slate-400 text-xs font-bold">⬚ OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View style={{ opacity: statsAnim, transform: [{ translateY: Animated.multiply(Animated.add(statsAnim, -1), -20) }] }}>
          <View className="px-6 mb-6">
            <View className="flex-row gap-3">
              <StatCard label="WINS" value={stats.wins} color="text-emerald-400" />
              <StatCard label="LOSSES" value={stats.losses} color="text-red-400" />
              <StatCard label="STREAK" value={stats.streak} color="text-amber-400" suffix="🔥" />
              <StatCard label="ELO" value={stats.elo} color="text-indigo-400" />
            </View>
          </View>
        </Animated.View>

        {/* ── Incoming Challenges ── */}
        {incomingChallenges.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-white text-lg font-black mb-3">⚡ Match Invitations</Text>
            {incomingChallenges.map((challenge) => (
              <View key={challenge.id} className="bg-slate-800 rounded-2xl p-4 border border-indigo-500/30 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-indigo-300 text-xs uppercase tracking-widest">Challenge from</Text>
                    <Text className="text-white font-black text-lg">{(challenge as any).fromUser?.username ?? 'Player'}</Text>
                  </View>
                  <View className="bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                    <Text className="text-indigo-400 text-xs font-bold">{(challenge as any).settings?.language ?? 'JS'}</Text>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => handleDecline(challenge.id)}
                    className="flex-1 py-3 rounded-xl border border-slate-600 items-center">
                    <Text className="text-slate-400 font-bold">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleAccept(challenge.id)}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 items-center shadow-lg shadow-indigo-500/30">
                    <Text className="text-white font-bold">Accept ⚔️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── CTA Buttons ── */}
        <Animated.View style={{ opacity: ctaAnim }}>
          <View className="px-6 mb-8">
            <Text className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Quick Actions</Text>

            {/* Quick Match */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Lobby', {})}
              style={{ shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 }}
              className="bg-indigo-600 rounded-3xl p-6 mb-3 overflow-hidden">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-indigo-200 text-xs uppercase tracking-widest mb-1">Find a Game</Text>
                  <Text className="text-white text-2xl font-black">Quick Match</Text>
                  <Text className="text-indigo-300 mt-1 text-sm">Random matchmaking · Play now</Text>
                </View>
                <View className="w-16 h-16 bg-indigo-500/40 rounded-2xl items-center justify-center">
                  <Text className="text-4xl">⚡</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Challenge Friend */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Friends')}
              className="bg-slate-800 rounded-3xl p-6 border border-slate-700/80 flex-row justify-between items-center">
              <View>
                <Text className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                  {onlineFriends.length > 0 ? `${onlineFriends.length} friends online` : 'Friends'}
                </Text>
                <Text className="text-white text-xl font-black">Challenge Friend</Text>
                <Text className="text-slate-500 mt-1 text-sm">Pick your rival · Custom match</Text>
              </View>
              <View className="w-14 h-14 bg-slate-700 rounded-2xl items-center justify-center">
                <Text className="text-3xl">👥</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Leaderboard Preview ── */}
        <Animated.View style={{ opacity: leaderAnim }}>
          <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-black">🏆 Leaderboard</Text>
              <TouchableOpacity>
                <Text className="text-indigo-400 text-sm font-bold">See All →</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-slate-800/60 rounded-3xl p-4 border border-slate-700/50">
              {leaderboard.map((player, i) => (
                <LeaderboardRow
                  key={player.id}
                  rank={i + 1}
                  username={player.username}
                  elo={player.elo}
                  isMe={player.username === user?.username}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Recent Matches ── */}
        <View className="px-6 mb-12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-black">🎮 Recent Matches</Text>
            <TouchableOpacity>
              <Text className="text-indigo-400 text-sm font-bold">History →</Text>
            </TouchableOpacity>
          </View>
          {recentMatches.map((m, i) => (
            <RecentMatchCard key={i} {...m} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
