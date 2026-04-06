import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface GridCellProps {
  status: 'empty' | 'preview' | 'placed' | 'invalid';
  onPress?: () => void;
  size: number;
}

const GridCell: React.FC<GridCellProps> = ({ status, onPress, size }) => {
  let bgColor = 'bg-slate-800';
  let borderColor = 'border-slate-700';

  if (status === 'preview') {
    bgColor = 'bg-indigo-500/50';
    borderColor = 'border-indigo-400';
  } else if (status === 'placed') {
    bgColor = 'bg-emerald-500';
    borderColor = 'border-emerald-400';
  } else if (status === 'invalid') {
    bgColor = 'bg-red-500/50';
    borderColor = 'border-red-400';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      style={{ width: size, height: size }}
      className={`border ${bgColor} ${borderColor}`}
    />
  );
};

export default GridCell;
