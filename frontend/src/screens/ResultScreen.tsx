import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { myScore, opponentScore, opponent, resetGame } = useGameStore();

  const isWinner = myScore > opponentScore;
  const isDraw = myScore === opponentScore;

  const handleFinish = () => {
    resetGame();
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-12 items-center">
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-6 border-4 ${
            isWinner ? 'bg-emerald-500/20 border-emerald-500' : 
            isDraw ? 'bg-indigo-500/20 border-indigo-500' : 'bg-red-500/20 border-red-500'
          }`}>
            <Text className="text-6xl">
              {isWinner ? '🏆' : isDraw ? '🤝' : '💀'}
            </Text>
          </View>
          
          <Text className="text-white text-4xl font-black mb-2">
            {isWinner ? 'VICTORY!' : isDraw ? 'DRAW!' : 'DEFEAT!'}
          </Text>
          <Text className="text-slate-400 text-lg text-center">
            {isWinner ? 'You dominated the grid!' : 
             isDraw ? 'It was a legendary match.' : 'Better luck in the next duel!'}
          </Text>
        </View>

        <View className="w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl mb-12">
          <View className="flex-row justify-between items-center mb-8">
            <View className="items-center flex-1">
              <Text className="text-slate-400 font-bold mb-1 uppercase text-xs">YOU</Text>
              <Text className="text-white text-4xl font-black">{myScore}</Text>
            </View>
            
            <View className="px-4">
              <Text className="text-slate-600 font-black text-xl">VS</Text>
            </View>

            <View className="items-center flex-1">
              <Text className="text-slate-400 font-bold mb-1 uppercase text-xs">
                {opponent?.username || 'OPPONENT'}
              </Text>
              <Text className="text-white text-4xl font-black">{opponentScore}</Text>
            </View>
          </View>

          <View className="h-px bg-slate-700 w-full mb-8" />

          <View className="items-center">
            <Text className="text-slate-500 text-sm mb-2">Total Questions Solved</Text>
            <Text className="text-indigo-400 text-xl font-bold">10 / 10</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleFinish}
          className="w-full bg-indigo-600 py-5 rounded-2xl items-center shadow-lg shadow-indigo-500/40"
        >
          <Text className="text-white text-xl font-bold">Return to Lobby</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResultScreen;
