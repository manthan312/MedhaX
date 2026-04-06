import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../store/gameStore';
import socketService from '../services/socket';

export const useAntiCheat = () => {
  const { gameId, currentPhase } = useGameStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // If the app goes to background during an active quiz round
      if (
        appState.current === 'active' && 
        nextAppState.match(/inactive|background/) && 
        gameId && 
        currentPhase === 'ACTIVE_QUIZ'
      ) {
        console.warn('Anti-Cheat: App moved to background during active round.');
        socketService.emitTelemetry('APP_BACKGROUNDED', {
          gameId,
          phase: currentPhase,
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [gameId, currentPhase]);

  const reportRapidSubmission = (timeToAnswer: number) => {
    if (timeToAnswer < 1000) { // Less than 1 second is suspicious for most coding questions
        socketService.emitTelemetry('RAPID_SUBMISSION', {
            gameId,
            timeToAnswer,
        });
    }
  };

  return { reportRapidSubmission };
};
