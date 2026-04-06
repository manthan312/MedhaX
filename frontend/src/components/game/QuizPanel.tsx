import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGameStore } from '../../store/gameStore';

interface QuizPanelProps {
  onAnswer: (answer: string) => Promise<void>;
  isSubmitting: boolean;
  feedback: string | null;
}

const QuizPanel: React.FC<QuizPanelProps> = ({ onAnswer, isSubmitting, feedback }) => {
  const { currentQuestion, currentQuestionIndex, currentPhase } = useGameStore();
  const [answer, setAnswer] = useState('');

  const isDisabled = currentPhase !== 'ACTIVE_QUIZ' || isSubmitting;

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer);
      setAnswer('');
    }
  };

  if (!currentQuestion) return null;

  return (
    <View className="p-6 bg-slate-900">
      <Text className="text-slate-500 font-bold mb-2 uppercase tracking-widest text-[10px]">
        Question {currentQuestionIndex + 1}
      </Text>
      
      <Text className="text-white text-xl font-bold mb-4">{currentQuestion.text}</Text>

      {currentQuestion.snippet && (
        <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
          <Text className="text-pink-400 font-mono text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
            {currentQuestion.snippet}
          </Text>
        </View>
      )}

      {feedback && (
        <View className={`mb-4 p-3 rounded-xl border ${
          feedback.includes('Correct') ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'
        }`}>
          <Text className={`text-center font-bold ${
            feedback.includes('Correct') ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {feedback}
          </Text>
        </View>
      )}

      <View className="flex-row space-x-3">
        <TextInput
          placeholder="Type your answer..."
          placeholderTextColor="#94A3B8"
          value={answer}
          onChangeText={setAnswer}
          disabled={isDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          className={`flex-1 bg-slate-800 border-2 rounded-xl px-4 py-3 text-white 
            ${isDisabled ? 'opacity-50 border-slate-700' : 'border-slate-700 focus:border-indigo-500'}`}
        />
        
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isDisabled}
          className={`px-6 rounded-xl justify-center bg-indigo-600 ${isDisabled ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {currentPhase === 'RESOLVED' && feedback?.includes('Correct') === false && (
        <Text className="text-red-400 text-center mt-4 font-bold">
          Opponent answered first! Input locked.
        </Text>
      )}
    </View>
  );
};

export default QuizPanel;
