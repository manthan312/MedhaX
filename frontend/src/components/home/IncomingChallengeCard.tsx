import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IncomingChallenge } from '../../types/challenge';

interface IncomingChallengeCardProps {
  challenge: IncomingChallenge;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

const IncomingChallengeCard: React.FC<IncomingChallengeCardProps> = ({ 
  challenge, 
  onAccept, 
  onDecline 
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(challenge.id);
    setIsAccepting(false);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await onDecline(challenge.id);
    setIsDeclining(false);
  };

  return (
    <View className="bg-slate-800 border border-slate-700 p-5 rounded-2xl mb-4 shadow-xl">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Incoming Challenge</Text>
          <Text className="text-white text-xl font-bold">{challenge.challenger.username}</Text>
        </View>
        <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
          <Text className="text-indigo-400 text-xs font-bold">{challenge.settings.language}</Text>
        </View>
      </View>
      
      <Text className="text-slate-300 mb-6">
        Wants to duel in <Text className="text-white font-bold">{challenge.settings.language}</Text> over <Text className="text-white font-bold">{challenge.settings.questions} questions</Text>.
      </Text>

      <View className="flex-row space-x-3">
        <TouchableOpacity 
          onPress={handleDecline}
          disabled={isAccepting || isDeclining}
          className="flex-1 bg-slate-700 py-3 rounded-xl items-center"
        >
          {isDeclining ? <ActivityIndicator size="small" color="#94A3B8" /> : <Text className="text-slate-300 font-bold">Decline</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleAccept}
          disabled={isAccepting || isDeclining}
          className="flex-2 bg-indigo-600 py-3 rounded-xl items-center"
          style={{ flex: 2 }}
        >
          {isAccepting ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">Accept Match</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IncomingChallengeCard;
