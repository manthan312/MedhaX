import { ShapeCell } from '../types/game';

/**
 * Rotate a set of relative coordinates by 90 degrees clockwise.
 */
export const rotateCells = (cells: ShapeCell[], times: number = 1): ShapeCell[] => {
  let rotated = [...cells];
  for (let i = 0; i < times % 4; i++) {
    rotated = rotated.map(cell => ({ x: cell.y, y: -cell.x }));
  }
  return rotated;
};

/**
 * Check if a set of absolute coordinates is within grid bounds.
 */
export const isWithinBounds = (cells: ShapeCell[], gridSize: number): boolean => {
  return cells.every(cell => 
    cell.x >= 0 && cell.x < gridSize && cell.y >= 0 && cell.y < gridSize
  );
};

/**
 * Check if a set of absolute coordinates overlaps with existing placements.
 */
export const isOverlapping = (cells: ShapeCell[], existingCells: ShapeCell[]): boolean => {
  return cells.some(cell => 
    existingCells.some(ec => ec.x === cell.x && ec.y === cell.y)
  );
};

/**
 * Convert relative shape cells to absolute grid coordinates based on an anchor.
 */
export const getAbsoluteCells = (anchor: ShapeCell, relativeCells: ShapeCell[]): ShapeCell[] => {
  return relativeCells.map(cell => ({
    x: anchor.x + cell.x,
    y: anchor.y + cell.y,
  }));
};

/**
 * Get the bounding box of a set of cells for centering previews.
 */
export const getBounds = (cells: ShapeCell[]) => {
  if (cells.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  
  return cells.reduce((acc, cell) => ({
    minX: Math.min(acc.minX, cell.x),
    maxX: Math.max(acc.maxX, cell.x),
    minY: Math.min(acc.minY, cell.y),
    maxY: Math.max(acc.maxY, cell.y),
  }), { 
    minX: cells[0].x, maxX: cells[0].x, 
    minY: cells[0].y, maxY: cells[0].y 
  });
};
