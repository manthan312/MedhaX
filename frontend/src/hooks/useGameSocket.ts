import { useEffect } from 'react';
import socketService from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { Question } from '../types/game';

export const useGameSocket = (gameId: string) => {
  const { 
    setQuestion, setPhase, setTimer, setScores, 
    revealOpponentCell, setGameOver 
  } = useGameStore();

  useEffect(() => {
    if (!gameId) return;

    socketService.emit('join_room', { gameId });

    socketService.on('question_started', (payload: { question: Question, index: number }) => {
      setQuestion(payload.question, payload.index);
      setPhase('ACTIVE_QUIZ');
      setTimer(60);
    });

    socketService.on('answer_result', (payload: { correct: boolean, winnerId: string, scores: { myScore: number, opponentScore: number } }) => {
      setScores(payload.scores.myScore, payload.scores.opponentScore);
      setPhase('RESOLVED');
    });

    socketService.on('dig_result', (payload: { x: number, y: number, hit: boolean, scores: { myScore: number, opponentScore: number } }) => {
      revealOpponentCell(payload.x, payload.y, payload.hit);
      setScores(payload.scores.myScore, payload.scores.opponentScore);
      // Logic for next question after dig
    });

    socketService.on('game_ended', (payload: { winnerId: string, finalScores: any }) => {
      setGameOver(true);
    });

    return () => {
      socketService.emit('leave_room', { gameId });
      socketService.off('question_started');
      socketService.off('answer_result');
      socketService.off('dig_result');
      socketService.off('game_ended');
    };
  }, [gameId]);
};
