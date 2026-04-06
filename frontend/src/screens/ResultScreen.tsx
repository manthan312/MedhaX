import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';
import { gameService } from '../services/gameService';
import { GameResult } from '../types/game';
import StatCard from '../components/game/StatCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { gameId } = route.params;
  
  const { opponent, resetGame } = useGameStore();
  const [result, setResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await gameService.getGameResult(gameId);
        setResult(data);
      } catch (err) {
        console.error('Failed to fetch game results', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, [gameId]);

  const isWinner = result?.myScore! > result?.opponentScore!;
  const isDraw = result?.myScore === result?.opponentScore;

  const handleFinish = () => {
    resetGame();
    navigation.navigate('Home');
  };

  const handleRematch = () => {
    Alert.alert('Rematch', 'Rematch functionality is coming soon in the next update!');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-slate-400 mt-4 font-bold">Calculating Results...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
        <View className="items-center mt-12 mb-12">
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-6 border-4 shadow-2xl ${
            isWinner ? 'bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20' : 
            isDraw ? 'bg-indigo-500/20 border-indigo-500 shadow-indigo-500/20' : 
            'bg-red-500/20 border-red-500 shadow-red-500/20'
          }`}>
            <Text className="text-6xl">
              {isWinner ? '🏆' : isDraw ? '🤝' : '💀'}
            </Text>
          </View>
          
          <Text className="text-white text-4xl font-black mb-2 tracking-tighter">
            {isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
          </Text>
          <Text className="text-slate-400 text-lg text-center font-medium">
            {isWinner ? 'You dominated the grid!' : 
             isDraw ? 'It was a legendary match.' : 'Better luck in the next duel!'}
          </Text>
        </View>

        {/* Score Comparison Card */}
        <View className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl mb-6">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1">
              <Text className="text-slate-500 font-bold mb-1 uppercase text-[10px] tracking-widest text-center">YOU</Text>
              <Text className="text-white text-4xl font-black">{result?.myScore}</Text>
            </View>
            
            <View className="px-6 border-x border-slate-700/50">
              <Text className="text-slate-600 font-black text-xl italic">VS</Text>
            </View>

            <View className="items-center flex-1">
              <Text className="text-slate-500 font-bold mb-1 uppercase text-[10px] tracking-widest text-center">
                {opponent?.username || 'OPPONENT'}
              </Text>
              <Text className="text-white text-4xl font-black">{result?.opponentScore}</Text>
            </View>
          </View>
        </View>

        {/* Detailed Stats Grid */}
        <View className="mb-8">
          <Text className="text-white text-lg font-black mb-4 ml-1">Match Stats</Text>
          
          <View className="flex-row justify-between mb-2">
            <StatCard 
              label="Accuracy" 
              value={`${Math.round(result?.stats.accuracy! * 100)}%`} 
              color="text-emerald-400"
            />
            <StatCard 
              label="Attempts" 
              value={result?.stats.attempts!} 
            />
          </View>

          <View className="flex-row justify-between mb-2">
            <StatCard 
              label="Avg Time" 
              value={`${(result?.stats.avgResponseTime! / 1000).toFixed(1)}s`} 
              subValue="per question"
            />
            <StatCard 
              label="Dig Hits" 
              value={result?.stats.digHits!} 
              color="text-indigo-400"
            />
          </View>

          {result?.antiCheatSummary && (
            <View className="mt-2 flex-row">
                <StatCard 
                label="FAIR PLAY STATUS" 
                value={result.antiCheatSummary} 
                color={result.antiCheatSummary === 'Clear' ? 'text-emerald-500' : 'text-amber-500'}
                />
            </View>
          )}
        </View>

        <View className="mb-12 space-y-4">
          <TouchableOpacity 
            onPress={handleRematch}
            className="w-full bg-slate-800 border border-slate-700 py-5 rounded-2xl items-center"
          >
            <Text className="text-white text-xl font-bold">Request Rematch</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleFinish}
            className="w-full bg-indigo-600 py-5 rounded-2xl items-center shadow-lg shadow-indigo-500/40"
          >
            <Text className="text-white text-xl font-bold">Return to Lobby</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResultScreen;
