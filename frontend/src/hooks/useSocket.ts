import { useEffect } from 'react';
import socketService from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

export const useSocket = () => {
  const { isAuthenticated, token } = useAuthStore();
  const { setIncomingChallenges } = useGameStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect();

      // Listen for global challenge events
      socketService.on('challenge_received', (newChallenge) => {
        // We could either re-fetch or append to the list
        // For production, appending is faster
        const currentChallenges = useGameStore.getState().incomingChallenges;
        setIncomingChallenges([newChallenge, ...currentChallenges]);
      });

      socketService.on('challenge_accepted', (payload) => {
        // Handle logic when someone accepts our challenge
        // Usually navigates us to the ShapePlacement screen
        console.log('Challenge accepted by opponent:', payload);
      });
    }

    return () => {
      socketService.off('challenge_received');
      socketService.off('challenge_accepted');
    };
  }, [isAuthenticated, token]);
};
