import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface SelectionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: string;
  description?: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ 
  label, 
  selected, 
  onSelect, 
  description 
}) => {
  return (
    <TouchableOpacity 
      onPress={onSelect}
      activeOpacity={0.7}
      className={`p-4 rounded-xl border-2 mb-3 ${
        selected ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={`text-lg font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>
            {label}
          </Text>
          {description && (
            <Text className="text-slate-500 text-sm mt-1">{description}</Text>
          )}
        </View>
        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
        }`}>
          {selected && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SelectionCard;
