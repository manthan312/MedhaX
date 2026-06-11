import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { joinLobby, sendReady, getSocket } from '../services/socket';
import { PlayerInfo } from '../types/game';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'Lobby'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: 'python', label: 'Python', emoji: '🐍' },
  { id: 'javascript', label: 'JavaScript', emoji: '🟨' },
  { id: 'java', label: 'Java', emoji: '☕' },
  { id: 'cpp', label: 'C++', emoji: '⚙️' },
];

const TOPICS_BY_LANGUAGE: Record<string, Array<{ id: string; label: string }>> = {
  javascript: [
    { id: 'JS-variables', label: 'Variables' },
    { id: 'JS-data-types', label: 'Data Types' },
    { id: 'JS-functions', label: 'Functions' },
    { id: 'JS-scope', label: 'Scope' },
    { id: 'JS-closures', label: 'Closures' },
    { id: 'JS-promises', label: 'Promises' },
    { id: 'JS-async-await', label: 'Async/Await' },
    { id: 'JS-event-loop', label: 'Event Loop' },
    { id: 'JS-DOM', label: 'DOM' },
    { id: 'JS-storage', label: 'Storage' },
  ],
  python: [
    { id: 'Python-basics', label: 'Basics' },
    { id: 'Python-data-types', label: 'Data Types' },
    { id: 'Python-functions', label: 'Functions' },
    { id: 'Python-exceptions', label: 'Exceptions' },
    { id: 'Python-lists', label: 'Lists' },
    { id: 'Python-decorators', label: 'Decorators' },
    { id: 'Python-generators', label: 'Generators' },
    { id: 'Python-OOP-concepts', label: 'OOP Concepts' },
    { id: 'Python-multithreading', label: 'Multithreading' },
    { id: 'Python-file-handling', label: 'File Handling' },
  ],
  java: [
    { id: 'Java-basics', label: 'Basics' },
    { id: 'Java-classes-objects', label: 'Classes & Objects' },
    { id: 'Java-OOP-concepts', label: 'OOP Concepts' },
    { id: 'Java-inheritance', label: 'Inheritance' },
    { id: 'Java-exceptions', label: 'Exceptions' },
    { id: 'Java-multithreading', label: 'Multithreading' },
    { id: 'Java-collections', label: 'Collections' },
    { id: 'Java-streams-api', label: 'Streams API' },
    { id: 'Java-garbage-collection', label: 'Garbage Collection' },
  ],
  cpp: [
    { id: 'file-io', label: 'File I/O' },
    { id: 'exception-handling', label: 'Exception Handling' },
    { id: 'OOP', label: 'OOP' },
    { id: 'functions-templates', label: 'Functions & Templates' },
    { id: 'pointers-stl', label: 'Pointers & STL' },
  ],
};

const DEFAULT_TOPICS = [
  { id: 'Arrays', label: 'Arrays' },
  { id: 'Strings', label: 'Strings' },
  { id: 'Trees', label: 'Trees' },
  { id: 'Graphs', label: 'Graphs' },
  { id: 'DP', label: 'DP' },
  { id: 'Sorting', label: 'Sorting' },
  { id: 'Recursion', label: 'Recursion' },
  { id: 'OOP', label: 'OOP' },
  { id: 'Pointers', label: 'Pointers' },
  { id: 'Regex', label: 'Regex' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PulseCircle: React.FC<{ ready: boolean }> = ({ ready }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ready) { pulse.setValue(1); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [ready]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulse }],
        backgroundColor: ready ? '#10B981' + '33' : '#1E293B',
        borderColor: ready ? '#10B981' : '#334155',
        borderWidth: 2,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text className="text-2xl">{ready ? '✓' : '?'}</Text>
    </Animated.View>
  );
};

const PlayerSlot: React.FC<{ player: PlayerInfo | null; isMe?: boolean; ping?: number }> = ({
  player, isMe, ping = 0,
}) => {
  const pingColor = ping < 80 ? '#10B981' : ping < 150 ? '#F59E0B' : '#EF4444';
  return (
    <View className="flex-1 bg-slate-800/80 rounded-3xl p-5 border border-slate-700/60 items-center">
      {player ? (
        <>
          <View className="w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center mb-3 border-2 border-indigo-400">
            <Text className="text-white text-2xl font-black">{player.username[0].toUpperCase()}</Text>
          </View>
          <Text className="text-white font-black text-base">{player.username}</Text>
          <Text className="text-indigo-400 text-xs font-bold">{player.elo ?? 1200} ELO</Text>
          {/* Latency */}
          <View className="flex-row items-center mt-2 gap-1">
            <View style={{ backgroundColor: pingColor }} className="w-2 h-2 rounded-full" />
            <Text style={{ color: pingColor }} className="text-xs font-bold">{ping}ms</Text>
          </View>
          {/* Ready toggle */}
          <View className="mt-3">
            <PulseCircle ready={player.ready} />
          </View>
          <Text className={`text-xs font-bold mt-2 ${player.ready ? 'text-emerald-400' : 'text-slate-500'}`}>
            {player.ready ? 'READY!' : 'Waiting...'}
          </Text>
          {isMe && <Text className="text-indigo-500 text-[10px] mt-1 uppercase tracking-widest">(You)</Text>}
        </>
      ) : (
        <>
          <View className="w-16 h-16 rounded-2xl bg-slate-700 items-center justify-center mb-3 border-2 border-dashed border-slate-600">
            <Text className="text-slate-500 text-2xl">?</Text>
          </View>
          <Text className="text-slate-500 font-bold">Waiting...</Text>
          <ActivityIndicator size="small" color="#6366F1" style={{ marginTop: 12 }} />
        </>
      )}
    </View>
  );
};

// ─── LobbyScreen ─────────────────────────────────────────────────────────────

const LobbyScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const user = useAuthStore((s) => s.user);
  const { matchId, players, config, setStatus } = useGameStore();

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [myPing, setMyPing] = useState(42);

  useEffect(() => {
    setSelectedTopics([]);
  }, [selectedLanguage]);

  const readyButtonScale = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entranceAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Join lobby via socket
    const mId = route.params?.matchId;
    const fId = route.params?.friendId;
    joinLobby({ matchId: mId, friendId: fId });

    // Ping simulation
    const pingInterval = setInterval(() => {
      setMyPing(Math.floor(Math.random() * 60) + 20);
    }, 3000);

    // Listen for lobby.update
    const socket = getSocket();
    if (socket) {
      socket.on('lobby.update', (payload: any) => {
        // Handled by useSocket hook → gameStore
        const allReady = payload.players?.every((p: PlayerInfo) => p.ready) && payload.players?.length === 2;
        setBothReady(allReady);
      });
    }

    return () => {
      clearInterval(pingInterval);
      getSocket()?.off('lobby.update');
    };
  }, []);

  // Computed grid size
  const gridSize = selectedTopics.length <= 3 ? 5 : 6;
  const activeTopics = TOPICS_BY_LANGUAGE[selectedLanguage] || DEFAULT_TOPICS;

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleReady = async () => {
    if (isSending) return;
    setIsSending(true);

    Animated.sequence([
      Animated.spring(readyButtonScale, { toValue: 0.93, useNativeDriver: true }),
      Animated.spring(readyButtonScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const newReady = !isReady;
    setIsReady(newReady);

    if (matchId) {
      sendReady({
        matchId,
        language: selectedLanguage,
        topics: selectedTopics,
      });
    }
    setIsSending(false);
  };

  // Derive my player and opponent
  const myPlayer: PlayerInfo | null = players.find((p) => p.id === user?.id)
    ?? (user ? { id: user.id, username: user.username, ready: isReady } : null);
  const opponent: PlayerInfo | null = players.find((p) => p.id !== user?.id) ?? null;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ flex: 1, opacity: entranceAnim }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* ── Header ── */}
          <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
              <Text className="text-slate-400 text-lg">←</Text>
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-white text-xl font-black">Game Lobby</Text>
              {matchId && <Text className="text-slate-600 text-xs font-mono">{matchId.slice(0, 8)}…</Text>}
            </View>
            <View className="w-10" />
          </View>

          {/* ── Player Slots ── */}
          <View className="px-6 mb-8">
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-4">Players</Text>
            <View className="flex-row gap-4">
              <PlayerSlot player={myPlayer ? { ...myPlayer, ready: isReady } : null} isMe ping={myPing} />
              <View className="items-center justify-center px-2">
                <View className="bg-slate-800 rounded-full w-10 h-10 items-center justify-center border border-slate-700">
                  <Text className="text-slate-500 font-black text-xs">VS</Text>
                </View>
              </View>
              <PlayerSlot player={opponent} ping={65} />
            </View>
          </View>

          {/* ── Language Selector ── */}
          <View className="px-6 mb-6">
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Language</Text>
            <View className="flex-row gap-3">
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => setSelectedLanguage(lang.id)}
                  style={{
                    flex: 1,
                    backgroundColor: selectedLanguage === lang.id ? '#6366F1' + '33' : '#1E293B',
                    borderColor: selectedLanguage === lang.id ? '#6366F1' : '#334155',
                    borderWidth: selectedLanguage === lang.id ? 2 : 1,
                    borderRadius: 16,
                    padding: 12,
                    alignItems: 'center',
                  }}>
                  <Text className="text-xl mb-1">{lang.emoji}</Text>
                  <Text
                    style={{ color: selectedLanguage === lang.id ? '#A5B4FC' : '#64748B' }}
                    className="text-xs font-bold">
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Topic Selection ── */}
          <View className="px-6 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-slate-400 text-xs uppercase tracking-widest">Topics</Text>
              <Text className="text-indigo-400 text-xs">{selectedTopics.length} selected</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {activeTopics.map((topic) => {
                const selected = selectedTopics.includes(topic.id);
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => toggleTopic(topic.id)}
                    style={{
                      backgroundColor: selected ? '#6366F1' : '#1E293B',
                      borderColor: selected ? '#6366F1' : '#334155',
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                    }}>
                    <Text style={{ color: selected ? '#fff' : '#64748B' }} className="text-sm font-bold">
                      {topic.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Grid Size Indicator ── */}
          <View className="px-6 mb-8">
            <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex-row items-center justify-between">
              <View>
                <Text className="text-slate-400 text-xs uppercase tracking-widest">Grid Size</Text>
                <Text className="text-white font-black text-2xl mt-1">{gridSize} × {gridSize}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  {gridSize === 5 ? 'Standard' : 'Large'} · {gridSize * gridSize} cells
                </Text>
              </View>
              <View
                style={{ borderColor: '#6366F1' + '44' }}
                className="border rounded-2xl p-3">
                {Array.from({ length: gridSize }).map((_, row) => (
                  <View key={row} className="flex-row">
                    {Array.from({ length: gridSize }).map((_, col) => (
                      <View
                        key={col}
                        style={{
                          width: 8,
                          height: 8,
                          margin: 1,
                          borderRadius: 2,
                          backgroundColor: Math.random() > 0.7 ? '#6366F1' : '#334155',
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Start Game (Both Ready) ── */}
          {bothReady && (
            <View className="px-6 mb-4">
              <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 items-center">
                <Text className="text-emerald-400 font-black text-lg">🚀 Both Players Ready!</Text>
                <Text className="text-emerald-300 text-sm mt-1">Game starting soon…</Text>
              </View>
            </View>
          )}

          {/* ── Ready Button ── */}
          <View className="px-6 mb-12">
            <Animated.View style={{ transform: [{ scale: readyButtonScale }] }}>
              <TouchableOpacity
                onPress={handleReady}
                disabled={isSending}
                style={{
                  backgroundColor: isReady ? '#10B981' : '#6366F1',
                  shadowColor: isReady ? '#10B981' : '#6366F1',
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 12,
                  borderRadius: 20,
                  paddingVertical: 20,
                  alignItems: 'center',
                }}>
                {isSending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white text-xl font-black tracking-widest">
                      {isReady ? '✓ READY!' : 'READY UP'}
                    </Text>
                    <Text style={{ color: isReady ? '#A7F3D0' : '#A5B4FC' }} className="text-xs mt-1">
                      {isReady ? 'Waiting for opponent…' : 'Tap to confirm settings'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default LobbyScreen;
