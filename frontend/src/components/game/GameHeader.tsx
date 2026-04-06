import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';

const GameHeader: React.FC = () => {
  const { timer, myScore, opponentScore, opponent, currentPhase } = useGameStore();
  const { user } = useAuthStore();

  const timerColor = timer <= 10 ? 'text-red-500' : 'text-indigo-400';
  const phaseLabel = currentPhase === 'ACTIVE_QUIZ' ? 'Question Active' : 
                    currentPhase === 'DIG_MODE' ? 'Dig Phase' : 'Resolved';

  return (
    <View className="px-6 pt-2 pb-4 bg-slate-900 border-b border-slate-800">
      <View className="flex-row justify-between items-center mb-4">
        {/* My Score */}
        <View className="items-center">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">YOU</Text>
          <Text className="text-white text-2xl font-black">{myScore}</Text>
        </View>

        {/* Timer */}
        <View className="items-center bg-slate-800/50 px-6 py-2 rounded-2xl border border-slate-700">
          <Text className={`text-3xl font-black ${timerColor}`}>{timer}s</Text>
          <Text className="text-slate-500 text-[10px] font-bold uppercase">{phaseLabel}</Text>
        </View>

        {/* Opponent Score */}
        <View className="items-center">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            {opponent?.username || 'OPPONENT'}
          </Text>
          <Text className="text-white text-2xl font-black">{opponentScore}</Text>
        </View>
      </View>

      {/* Progress Bar (Visual Timer) */}
      <View className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <View 
          className={`h-full ${timer <= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${(timer / 60) * 100}%` }}
        />
      </View>
    </View>
  );
};

export default GameHeader;
