import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { gameService } from '../services/gameService';
import IncomingChallengeCard from '../components/home/IncomingChallengeCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const { incomingChallenges, setIncomingChallenges, removeChallenge, setGameId, setOpponent, setSettings } = useGameStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChallenges = useCallback(async () => {
    try {
      const data = await gameService.getIncomingChallenges();
      setIncomingChallenges(data);
    } catch (err) {
      console.error('Failed to fetch challenges', err);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
    // Optional: Set up an interval or prepare for Socket.io integration here
  }, [fetchChallenges]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchChallenges();
    setIsRefreshing(false);
  };

  const handleAccept = async (id: string) => {
    try {
      const gameRoom = await gameService.acceptChallenge(id);
      
      // Update store with new game session details
      setGameId(gameRoom.id);
      setOpponent(gameRoom.opponent);
      setSettings(gameRoom.settings);
      
      // Navigate to Shape Placement
      navigation.navigate('ShapePlacement', { gameId: gameRoom.id });
    } catch (err) {
      Alert.alert('Match Error', 'Could not accept the challenge at this time.');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await gameService.declineChallenge(id);
      removeChallenge(id);
    } catch (err) {
      Alert.alert('Error', 'Failed to decline challenge.');
    }
  };

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-6">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-slate-400 font-medium">Hello,</Text>
          <Text className="text-white text-3xl font-bold">{user?.username || 'Player'}</Text>
        </View>
        <TouchableOpacity 
          onPress={logout}
          className="bg-slate-800 p-3 rounded-full border border-slate-700"
        >
          <Text className="text-slate-400">Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Incoming Challenges Section */}
        {incomingChallenges.length > 0 && (
          <View className="mb-8">
            <Text className="text-white text-xl font-black mb-4">Match Invitations</Text>
            {incomingChallenges.map((challenge) => (
              <IncomingChallengeCard 
                key={challenge.id}
                challenge={challenge}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </View>
        )}

        <Text className="text-white text-xl font-black mb-4">Quick Actions</Text>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('SearchFriend')}
          className="bg-indigo-600 p-6 rounded-3xl mb-4 shadow-lg shadow-indigo-500/20"
        >
          <Text className="text-white text-2xl font-black">Find Opponent</Text>
          <Text className="text-indigo-200 mt-1">Search for your friends to play</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('SearchFriend')}
          className="bg-slate-800 p-6 rounded-3xl mb-6 border border-slate-700"
        >
          <Text className="text-white text-xl font-bold">Random Match</Text>
          <Text className="text-slate-400 mt-1">Jump into a random coding duel</Text>
        </TouchableOpacity>

        <View className="bg-slate-800 p-6 rounded-3xl mb-12 border border-slate-700">
          <Text className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">Your Statistics</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-slate-500 text-xs">MATCHES</Text>
              <Text className="text-2xl font-bold text-white">24</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-xs">WIN RATE</Text>
              <Text className="text-2xl font-bold text-emerald-500">68%</Text>
            </View>
            <View>
              <Text className="text-slate-500 text-xs">ELO</Text>
              <Text className="text-2xl font-bold text-indigo-400">1420</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
