import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import { useFriendStore, User, FriendRequest } from '../store/friendStore';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── User Row ─────────────────────────────────────────────────────────────────

const UserRow: React.FC<{
  user: User;
  actionLabel?: string;
  actionColor?: string;
  onAction?: () => void;
  isOnline?: boolean;
  subtitle?: string;
  rightContent?: React.ReactNode;
}> = ({ user, actionLabel, actionColor = '#6366F1', onAction, isOnline, subtitle, rightContent }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onAction?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View className="flex-row items-center py-3 px-4 bg-slate-800/70 rounded-2xl mb-2 border border-slate-700/40">
        {/* Avatar */}
        <View className="relative mr-3">
          <View className="w-11 h-11 rounded-xl bg-indigo-600 items-center justify-center">
            <Text className="text-white font-black text-lg">{user.username[0].toUpperCase()}</Text>
          </View>
          {isOnline !== undefined && (
            <View
              style={{ backgroundColor: isOnline ? '#10B981' : '#475569' }}
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800"
            />
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{user.username}</Text>
          <Text className="text-slate-500 text-xs">
            {subtitle ?? (isOnline !== undefined ? (isOnline ? 'Online' : 'Offline') : `ELO: ${user.elo ?? '—'}`)}
          </Text>
        </View>

        {/* Right side */}
        {rightContent ?? (actionLabel && (
          <TouchableOpacity
            onPress={handlePress}
            style={{ backgroundColor: actionColor + '22', borderColor: actionColor + '66', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ color: actionColor }} className="font-bold text-sm">{actionLabel}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

// ─── Request Card ─────────────────────────────────────────────────────────────

const RequestCard: React.FC<{
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ request, onAccept, onDecline }) => (
  <View className="flex-row items-center py-3 px-4 bg-slate-800/70 rounded-2xl mb-2 border border-indigo-500/20">
    <View className="w-11 h-11 rounded-xl bg-indigo-600 items-center justify-center mr-3">
      <Text className="text-white font-black text-lg">{request.fromUser.username[0].toUpperCase()}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-white font-bold">{request.fromUser.username}</Text>
      <Text className="text-indigo-400 text-xs">Sent you a friend request</Text>
    </View>
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={onDecline}
        className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2">
        <Text className="text-slate-300 font-bold text-sm">✕</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onAccept}
        className="bg-indigo-600 rounded-xl px-3 py-2">
        <Text className="text-white font-bold text-sm">✓</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; count?: number; badge?: string }> = ({ title, count, badge }) => (
  <View className="flex-row items-center justify-between mb-3 mt-2">
    <View className="flex-row items-center gap-2">
      <Text className="text-white font-black text-base">{title}</Text>
      {count !== undefined && (
        <View className="bg-indigo-600/30 border border-indigo-500/30 rounded-full px-2 py-0.5">
          <Text className="text-indigo-400 text-xs font-bold">{count}</Text>
        </View>
      )}
    </View>
    {badge && <Text className="text-slate-500 text-xs">{badge}</Text>}
  </View>
);

// ─── FriendsScreen ────────────────────────────────────────────────────────────

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const {
    friends,
    pendingRequests,
    searchResults,
    isSearching,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    searchUsers,
    clearSearch,
    sendFriendRequest,
    respondToRequest,
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchFriends();
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchUsers(debouncedQuery);
    } else {
      clearSearch();
    }
  }, [debouncedQuery]);

  const handleSendRequest = async (userId: string) => {
    setLoadingAction(userId);
    try {
      await sendFriendRequest(userId);
    } catch {
      Alert.alert('Error', 'Could not send friend request.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRespond = async (requestId: string, accept: boolean) => {
    setLoadingAction(requestId);
    try {
      await respondToRequest(requestId, accept);
    } catch {
      Alert.alert('Error', 'Action failed. Please try again.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChallenge = (friend: User) => {
    navigation.navigate('Lobby', { friendId: friend.id });
  };

  const onlineFriends = friends.filter((f) => f.isOnline);
  const offlineFriends = friends.filter((f) => !f.isOnline);

  const friendIds = new Set(friends.map((f) => f.id));
  const sentIds = new Set<string>(); // Track sent requests

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ flex: 1, opacity: headerAnim }}>
        {/* ── Header ── */}
        <View className="px-6 pt-5 pb-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Text className="text-slate-400 text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-black">Friends</Text>
          <View className="bg-indigo-600/20 border border-indigo-500/30 rounded-full px-3 py-1">
            <Text className="text-indigo-400 text-xs font-bold">{onlineFriends.length} Online</Text>
          </View>
        </View>

        {/* ── Tab Switcher ── */}
        <View className="px-6 mb-4">
          <View className="bg-slate-800 rounded-2xl p-1 flex-row border border-slate-700">
            {(['friends', 'search'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{ flex: 1, backgroundColor: activeTab === tab ? '#6366F1' : 'transparent', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: activeTab === tab ? '#fff' : '#64748B', fontWeight: '700', textTransform: 'capitalize' }}>
                  {tab === 'friends' ? '👥 Friends' : '🔍 Find People'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {activeTab === 'search' ? (
            <>
              {/* ── Search Bar ── */}
              <View className="mb-5">
                <View className="flex-row items-center bg-slate-800 rounded-2xl border border-slate-700 px-4 gap-3">
                  <Text className="text-slate-500 text-lg">🔍</Text>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by username…"
                    placeholderTextColor="#475569"
                    className="flex-1 text-white py-4 text-base"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); clearSearch(); }}>
                      <Text className="text-slate-500 text-lg">✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ── Search Results ── */}
              {isSearching ? (
                <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
              ) : searchResults.length > 0 ? (
                <>
                  <SectionHeader title="Results" count={searchResults.length} />
                  {searchResults.map((u) => {
                    const isFriend = friendIds.has(u.id);
                    const isMe = u.id === user?.id;
                    return (
                      <UserRow
                        key={u.id}
                        user={u}
                        actionLabel={isMe ? undefined : isFriend ? 'Friends ✓' : loadingAction === u.id ? '…' : 'Add'}
                        actionColor={isFriend ? '#10B981' : '#6366F1'}
                        onAction={isMe || isFriend ? undefined : () => handleSendRequest(u.id)}
                      />
                    );
                  })}
                </>
              ) : searchQuery.length > 0 ? (
                <View className="items-center py-12">
                  <Text className="text-4xl mb-3">😶</Text>
                  <Text className="text-slate-400 font-bold">No users found</Text>
                  <Text className="text-slate-600 text-sm mt-1">Try a different username</Text>
                </View>
              ) : (
                <View className="items-center py-12">
                  <Text className="text-4xl mb-3">🔍</Text>
                  <Text className="text-slate-400 font-bold">Search for players</Text>
                  <Text className="text-slate-600 text-sm mt-1">Type to find people to add</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* ── Pending Requests ── */}
              {pendingRequests.length > 0 && (
                <View className="mb-5">
                  <SectionHeader title="Pending Requests" count={pendingRequests.length} />
                  {pendingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={() => handleRespond(req.id, true)}
                      onDecline={() => handleRespond(req.id, false)}
                    />
                  ))}
                </View>
              )}

              {/* ── Online Friends ── */}
              {onlineFriends.length > 0 && (
                <View className="mb-5">
                  <SectionHeader
                    title="Online Now"
                    count={onlineFriends.length}
                    badge="Ready to play"
                  />
                  {onlineFriends.map((f) => (
                    <UserRow
                      key={f.id}
                      user={f}
                      isOnline
                      actionLabel="Challenge ⚔️"
                      actionColor="#6366F1"
                      onAction={() => handleChallenge(f)}
                    />
                  ))}
                </View>
              )}

              {/* ── Offline Friends ── */}
              {offlineFriends.length > 0 && (
                <View className="mb-5">
                  <SectionHeader title="Friends" count={offlineFriends.length} />
                  {offlineFriends.map((f) => (
                    <UserRow
                      key={f.id}
                      user={f}
                      isOnline={false}
                    />
                  ))}
                </View>
              )}

              {/* ── Empty State ── */}
              {friends.length === 0 && !isLoading && (
                <View className="items-center py-16">
                  <Text className="text-5xl mb-4">👥</Text>
                  <Text className="text-white font-black text-xl">No Friends Yet</Text>
                  <Text className="text-slate-500 text-center mt-2 text-sm">
                    Search for players to add as friends and challenge them to duels!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveTab('search')}
                    className="mt-6 bg-indigo-600 rounded-2xl px-8 py-4">
                    <Text className="text-white font-black">Find People</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isLoading && <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />}
            </>
          )}

          <View className="h-16" />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default FriendsScreen;
