import api from './api';
import { IncomingChallenge } from '../types/challenge';
import { GameRoom, ShapeTemplate, Placement, Question, GameResult } from '../types/game';

export interface ChallengeSettings {
  questions: number;
  language: string;
}

export const gameService = {
  sendChallenge: async (opponentId: string, settings: ChallengeSettings) => {
    try {
      const response = await api.post('/challenges/create', { 
        opponentId, 
        settings 
      });
      return response.data; // Expected: { gameId }
    } catch (error) {
      console.error('Error sending challenge:', error);
      throw error;
    }
  },

  getIncomingChallenges: async (): Promise<IncomingChallenge[]> => {
    try {
      const response = await api.get('/challenges/incoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming challenges:', error);
      throw error;
    }
  },

  acceptChallenge: async (challengeId: string): Promise<GameRoom> => {
    try {
      const response = await api.post(`/challenges/${challengeId}/accept`);
      return response.data; // Expected: GameRoom payload
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  },

  declineChallenge: async (challengeId: string): Promise<void> => {
    try {
      await api.post(`/challenges/${challengeId}/decline`);
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  },

  getShapeTemplates: async (gameId: string): Promise<ShapeTemplate[]> => {
    try {
      const response = await api.get(`/game-rooms/${gameId}/shapes`);
      return response.data;
    } catch (error) {
      return [
        { id: '1', name: 'L-Shape', cells: [{x:0,y:0}, {x:0,y:1}, {x:0,y:2}, {x:1,y:2}] },
        { id: '2', name: 'T-Shape', cells: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:1,y:1}] },
        { id: '3', name: 'ZigZag', cells: [{x:0,y:0}, {x:0,y:1}, {x:1,y:1}, {x:1,y:2}] },
        { id: '4', name: 'Cross', cells: [{x:1,y:0}, {x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:1,y:2}] },
      ];
    }
  },

  submitPlacement: async (gameId: string, placements: Placement[]): Promise<void> => {
    try {
      await api.post(`/game-rooms/${gameId}/placement`, { placements });
    } catch (error) {
      console.error('Error submitting placement:', error);
      throw error;
    }
  },

  submitAnswer: async (gameId: string, questionId: string, answer: string) => {
    try {
      const response = await api.post(`/games/${gameId}/answer`, { questionId, answer });
      return response.data; // Expected: { correct: boolean, first: boolean, score: number }
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  digCell: async (gameId: string, x: number, y: number) => {
    try {
      const response = await api.post(`/games/${gameId}/dig`, { x, y });
      return response.data; // Expected: { hit: boolean, cellState: 'REVEALED_HIT' | 'REVEALED_MISS' }
    } catch (error) {
      console.error('Error digging cell:', error);
      throw error;
    }
  },

  getGameResult: async (gameId: string): Promise<GameResult> => {
    try {
      const response = await api.get(`/game-rooms/${gameId}/result`);
      return response.data;
    } catch (error) {
      // Return mock for UI development
      return {
        winnerId: 'current-user-id',
        myScore: 1200,
        opponentScore: 850,
        stats: {
          accuracy: 0.85,
          attempts: 12,
          avgResponseTime: 4200,
          digHits: 4,
        },
        antiCheatSummary: 'Clear'
      };
    }
  }
};
