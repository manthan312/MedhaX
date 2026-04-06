import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

type NavigationProp = StackNavigationProp<RootStackParamList, 'SearchFriend'>;

interface UserResult {
  id: string;
  username: string;
}

const SearchFriendScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.user);
  const setOpponent = useGameStore((state) => state.setOpponent);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.searchUsers(searchTerm);
      // Exclude current user
      const filtered = data.filter((u: UserResult) => u.id !== currentUser?.id);
      setResults(filtered);
    } catch (err) {
      setError('Failed to search users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChallenge = (user: UserResult) => {
    setOpponent({ id: user.id, username: user.username });
    navigation.navigate('ChallengeSetup', { friendId: user.id });
  };

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-6">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Find Friends</Text>
      </View>

      <View className="mb-6">
        <TextInput
          placeholder="Search by username..."
          placeholderTextColor="#94A3B8"
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          className="bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6366F1" className="mt-8" />
      ) : error ? (
        <Text className="text-red-500 text-center mt-8">{error}</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            searchTerm.length >= 2 ? (
              <Text className="text-slate-500 text-center mt-8">No users found</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="bg-slate-800 border border-slate-700 p-4 rounded-2xl mb-3 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="text-white font-bold text-lg">{item.username}</Text>
                <Text className="text-slate-500">Available to challenge</Text>
              </View>
              <TouchableOpacity
                onPress={() => onChallenge(item)}
                className="bg-indigo-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-bold">Challenge</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default SearchFriendScreen;
