import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import { ShapeCell } from '../../types/game';

interface DualBoardViewProps {
  onDig?: (x: number, y: number) => void;
  canDig: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = (SCREEN_WIDTH - 64) / 2; // Two boards side-by-side with padding

const SingleBoard: React.FC<{ 
  gridSize: number, 
  cells: { x: number, y: number, color: string }[], 
  onPress?: (x: number, y: number) => void,
  title: string
}> = ({ gridSize, cells, onPress, title }) => {
  const cellSize = Math.floor(BOARD_SIZE / gridSize);

  return (
    <View className="items-center">
      <Text className="text-slate-500 font-bold mb-2 text-[10px] uppercase tracking-widest">{title}</Text>
      <View 
        style={{ width: cellSize * gridSize, height: cellSize * gridSize }}
        className="bg-slate-900 border-2 border-slate-800"
      >
        {Array.from({ length: gridSize }).map((_, y) => (
          <View key={y} className="flex-row">
            {Array.from({ length: gridSize }).map((_, x) => {
              const cellData = cells.find(c => c.x === x && c.y === y);
              const color = cellData?.color || 'bg-slate-800/50';

              return (
                <TouchableOpacity
                  key={`${x}-${y}`}
                  disabled={!onPress}
                  onPress={() => onPress?.(x, y)}
                  style={{ width: cellSize, height: cellSize }}
                  className={`border-[0.5px] border-slate-700 ${color}`}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const DualBoardView: React.FC<DualBoardViewProps> = ({ onDig, canDig }) => {
  const { settings, myPlacements, opponentBoardRevealed, opponent, currentPhase } = useGameStore();
  const { gridSize } = settings;

  const myBoardCells = myPlacements.map(p => ({ x: p.x, y: p.y, color: 'bg-emerald-500/40' }));
  
  const opponentBoardCells = opponentBoardRevealed.map(c => ({
    x: c.x, y: c.y,
    color: c.state === 'HIT' ? 'bg-red-500' : 'bg-slate-600'
  }));

  const handlePress = (x: number, y: number) => {
     // Check if cell already revealed
     if (opponentBoardRevealed.some(c => c.x === x && c.y === y)) return;
     if (canDig) {
       onDig?.(x, y);
     }
  };

  return (
    <View className="flex-row justify-between p-6 bg-slate-900 border-t border-slate-800">
      <SingleBoard 
        title="YOUR BOARD"
        gridSize={gridSize}
        cells={myBoardCells}
      />
      
      <SingleBoard 
        title={`${opponent?.username || 'OPPONENT'}'S BOARD`}
        gridSize={gridSize}
        cells={opponentBoardCells}
        onPress={canDig ? handlePress : undefined}
      />
    </View>
  );
};

export default DualBoardView;
