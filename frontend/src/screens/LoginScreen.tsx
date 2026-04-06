import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import InputField from '../components/common/InputField';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const loginSchema = z.object({
  identifier: z.string().min(3, 'Username or Email must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
      navigation.replace('Home');
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <ScrollView 
       contentContainerStyle={{ flexGrow: 1 }} 
       className="bg-slate-900" 
       keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-8 py-12">
        <Text className="text-white text-4xl font-black mb-2">Welcome Back</Text>
        <Text className="text-slate-400 text-lg mb-10">Sign in to continue playing</Text>

        {error && (
          <View className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6">
            <Text className="text-red-500 text-center font-medium">{error}</Text>
          </View>
        )}

        <InputField
          name="identifier"
          control={control}
          label="Username or Email"
          placeholder="Enter your credentials"
          error={errors.identifier}
          autoCapitalize="none"
        />

        <InputField
          name="password"
          control={control}
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className={`bg-indigo-600 py-4 rounded-xl items-center mt-6 ${isLoading ? 'opacity-70' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Login</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-slate-400">Don't have an account? </Text>
          <TouchableOpacity onPress={() => { clearError(); navigation.navigate('Signup'); }}>
            <Text className="text-indigo-500 font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Home')}
          className="mt-8 items-center"
        >
          <Text className="text-slate-500 font-medium">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;
