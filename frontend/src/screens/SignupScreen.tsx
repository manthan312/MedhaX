import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../store/authStore';
import InputField from '../components/common/InputField';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data.username, data.email, data.password);
      navigation.replace('Home');
    } catch (err) {
      // Error is handled by the store and displayed via `error` state
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1 }} 
      className="bg-slate-900"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-8 py-12">
        <Text className="text-white text-4xl font-black mb-2">Join MedhaX</Text>
        <Text className="text-slate-400 text-lg mb-10">Create an account to start playing</Text>

        {error && (
          <View className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl mb-6">
            <Text className="text-red-500 text-center font-medium">{error}</Text>
          </View>
        )}

        <InputField
          name="username"
          control={control as any}
          label="Username"
          placeholder="Choose a username"
          error={errors.username}
          autoCapitalize="none"
        />

        <InputField
          name="email"
          control={control as any}
          label="Email"
          placeholder="Enter your email"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          name="password"
          control={control as any}
          label="Password"
          placeholder="Create a password"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className={`bg-pink-600 py-4 rounded-xl items-center mt-6 ${isLoading ? 'opacity-70' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Create Account</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-slate-400">Already have an account? </Text>
          <TouchableOpacity onPress={() => { clearError(); navigation.navigate('Login'); }}>
            <Text className="text-pink-500 font-bold">Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignupScreen;
