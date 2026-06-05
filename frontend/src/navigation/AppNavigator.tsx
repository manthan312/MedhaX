import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import LobbyScreen from '../screens/LobbyScreen';
import SearchFriendScreen from '../screens/SearchFriendScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ChallengeSetupScreen from '../screens/ChallengeSetupScreen';
import ShapePlacementScreen from '../screens/ShapePlacementScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0F172A' },
        // Smooth slide transition
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width * 0.15, 0],
                }),
              },
            ],
          },
        }),
      }}>
      {/* ── Auth Screens ── */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />

      {/* ── Main App Screens ── */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="SearchFriend" component={SearchFriendScreen} />
      <Stack.Screen name="ChallengeSetup" component={ChallengeSetupScreen} />

      {/* ── Game Flow ── */}
      <Stack.Screen name="Lobby" component={LobbyScreen} />
      <Stack.Screen name="ShapePlacement" component={ShapePlacementScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
