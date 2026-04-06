import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';
import { gameService } from '../services/gameService';
import SelectionCard from '../components/common/SelectionCard';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ChallengeSetup'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeSetup'>;

const ChallengeSetupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { friendId } = route.params || {};

  const { opponent, setSettings, setGameId } = useGameStore();
  const [numQuestions, setNumQuestions] = useState(10);
  const [language, setLanguage] = useState('JavaScript');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onConfirm = async () => {
    if (!friendId && !opponent?.id) {
      Alert.alert('Error', 'No opponent selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const settings = { questions: numQuestions, language };
      setSettings(settings);
      
      const targetId = friendId || opponent?.id!;
      const response = await gameService.sendChallenge(targetId, settings);
      
      setGameId(response.gameId);
      navigation.navigate('ShapePlacement', { gameId: response.gameId });
    } catch (err) {
      Alert.alert('Challenge Failed', 'Could not send challenge invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-6">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Challenge Setup</Text>
      </View>

      <Text className="text-slate-400 mb-6 italic">
        Challenging: <Text className="text-indigo-400 font-bold">{opponent?.username || 'Opponent'}</Text>
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="text-white text-xl font-bold mb-4">Number of Questions</Text>
        <View className="flex-row flex-wrap justify-between">
          {[10, 20, 50].map((num) => (
             <View key={num} className="w-[31%]">
              <SelectionCard 
                label={`${num}`} 
                selected={numQuestions === num}
                onSelect={() => setNumQuestions(num)}
              />
             </View>
          ))}
        </View>

        <Text className="text-white text-xl font-bold mt-6 mb-4">Programming Language</Text>
        <View>
          {['JavaScript', 'Python', 'Java', 'C++', 'C'].map((lang) => (
            <SelectionCard 
              key={lang}
              label={lang}
              selected={language === lang}
              onSelect={() => setLanguage(lang)}
              description={`Quiz based on ${lang} syntax and concepts.`}
            />
          ))}
        </View>

        <TouchableOpacity 
          onPress={onConfirm}
          disabled={isSubmitting}
          className={`bg-indigo-600 py-4 rounded-2xl items-center mt-8 mb-12 shadow-lg shadow-indigo-500/20 ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Send Invitation</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ChallengeSetupScreen;
