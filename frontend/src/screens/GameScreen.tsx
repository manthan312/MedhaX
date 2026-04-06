import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';
import { gameService } from '../services/gameService';
import { useAntiCheat } from '../hooks/useAntiCheat'; // Anti-cheat hook
import GameHeader from '../components/game/GameHeader';
import QuizPanel from '../components/game/QuizPanel';
import DualBoardView from '../components/game/DualBoardView';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

const GameScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { gameId } = route.params;
  const { reportRapidSubmission } = useAntiCheat(); // Anti-cheat detection

  const { 
    currentPhase, setPhase, 
    currentQuestion, setQuestion,
    timer, setTimer, 
    revealOpponentCell, setScores,
    lastQuestionStartTime // Timing
  } = useGameStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [canDig, setCanDig] = useState(false);

  // Timer Logic
  useEffect(() => {
    if (timer <= 0) {
      if (currentPhase === 'ACTIVE_QUIZ') {
        handleTimeout();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer(timer - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, currentPhase]);

  // Initial Data Fetch
  useEffect(() => {
    setQuestion({
      id: 'q1',
      text: 'What is the output of console.log(typeof NaN)?',
      snippet: 'console.log(typeof NaN);',
      language: 'JavaScript'
    }, 0);
  }, [gameId]);

  const handleTimeout = () => {
    setFeedback('Time is up!');
    setPhase('RESOLVED');
  };

  const onAnswer = async (answer: string) => {
    const now = Date.now();
    const timeToAnswer = lastQuestionStartTime ? now - lastQuestionStartTime : 999999;
    
    // Anti-cheat signaling
    reportRapidSubmission(timeToAnswer);

    setIsSubmitting(true);
    try {
      // In production, we send the timeToAnswer to the backend for analytics
      const result = await gameService.submitAnswer(gameId, currentQuestion?.id!, answer);
      
      if (result.correct) {
        setFeedback('Correct! You answered first!');
        setPhase('DIG_MODE');
        setCanDig(true);
        setScores(result.myScore, result.opponentScore);
      } else {
        setFeedback('Incorrect answer. Try again!');
      }
    } catch (err) {
      setFeedback('Error submitting answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDig = async (x: number, y: number) => {
    if (!canDig) return;
    
    try {
      const result = await gameService.digCell(gameId, x, y);
      revealOpponentCell(x, y, result.hit);
      Alert.alert(result.hit ? 'DIRECT HIT!' : 'MISS!', result.hit ? 'You destroyed part of the opponent\'s ship!' : 'Better luck next time.');
      
      setCanDig(false);
      setPhase('COOLDOWN');
      setFeedback('Waiting for next question...');
      
      setTimeout(() => {
        setPhase('ACTIVE_QUIZ');
        setTimer(60);
        setFeedback(null);
      }, 3000);

    } catch (err) {
      Alert.alert('Error', 'Radar failed! Could not perform dig.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <GameHeader />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <QuizPanel 
          onAnswer={onAnswer} 
          isSubmitting={isSubmitting} 
          feedback={feedback} 
        />
        
        <DualBoardView 
          onDig={handleDig} 
          canDig={canDig} 
        />
        
        {currentPhase === 'DIG_MODE' && canDig && (
          <View className="p-6">
            <View className="bg-indigo-500 p-4 rounded-2xl shadow-lg border border-indigo-400">
              <Text className="text-white font-black text-center text-lg uppercase">
                TARGET ACQUIRED: TAP OPPONENT BOARD TO DIG
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GameScreen;
