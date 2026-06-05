import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSocket } from './src/hooks/useSocket';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

/**
 * Inner wrapper so that useSocket() can use useNavigation()
 * which requires being inside a NavigationContainer.
 */
const AppInner: React.FC = () => {
  useSocket(); // Global real-time socket listener
  return <AppNavigator />;
};

export default function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppInner />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
