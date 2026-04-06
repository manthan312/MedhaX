import React from 'react';
import { View, Dimensions } from 'react-native';
import GridCell from './GridCell';
import { ShapeCell } from '../../types/game';

interface PlacementGridProps {
  gridSize: number;
  placements: ShapeCell[]; // All cells of already placed shapes
  previewCells?: ShapeCell[]; // Cells of the shape currently being "hovered"
  isInvalidPreview?: boolean;
  onCellPress: (x: number, y: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CONTAINER_SIZE = SCREEN_WIDTH - 48; // Padding on sides

const PlacementGrid: React.FC<PlacementGridProps> = ({ 
  gridSize, 
  placements, 
  previewCells = [], 
  isInvalidPreview = false,
  onCellPress 
}) => {
  const cellSize = Math.floor(GRID_CONTAINER_SIZE / gridSize);

  const getCellStatus = (x: number, y: number) => {
    const isPlaced = placements.some(cell => cell.x === x && cell.y === y);
    const isPreview = previewCells.some(cell => cell.x === x && cell.y === y);

    if (isPlaced) return 'placed';
    if (isPreview) return isInvalidPreview ? 'invalid' : 'preview';
    return 'empty';
  };

  return (
    <View 
      style={{ width: cellSize * gridSize, height: cellSize * gridSize }}
      className="bg-slate-900 border-2 border-slate-700 mx-auto items-center justify-center"
    >
      {Array.from({ length: gridSize }).map((_, y) => (
        <View key={y} className="flex-row">
          {Array.from({ length: gridSize }).map((_, x) => (
            <GridCell
              key={`${x}-${y}`}
              size={cellSize}
              status={getCellStatus(x, y)}
              onPress={() => onCellPress(x, y)}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export default PlacementGrid;
