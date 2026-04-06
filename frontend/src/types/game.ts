export interface ShapeCell {
  x: number;
  y: number;
}

export interface ShapeTemplate {
  id: string;
  name: string;
  cells: ShapeCell[]; // Relative to (0,0) anchor
}

export interface Placement {
  shapeId: string;
  anchor: ShapeCell; // Grid coordinates where (0,0) of shape is placed
  cells: ShapeCell[]; // Absolute grid coordinates
}

export type GamePhase = 'ACTIVE_QUIZ' | 'RESOLVED' | 'DIG_MODE' | 'COOLDOWN';

export interface Question {
  id: string;
  text: string;
  snippet?: string;
  language: string;
}

export type CellState = 'HIDDEN' | 'REVEALED_HIT' | 'REVEALED_MISS' | 'MY_SHIP';

export interface GameRoom {
  id: string;
  opponent: {
    id: string;
    username: string;
  };
  status: 'pending' | 'active' | 'completed';
  settings: {
    questions: number;
    language: string;
    gridSize?: number;
  };
  createdAt: string;
}
