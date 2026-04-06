import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShapeTemplate } from '../../types/game';

interface ShapePaletteProps {
  templates: ShapeTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placedIds: string[];
}

const ShapePalette: React.FC<ShapePaletteProps> = ({ 
  templates, 
  selectedId, 
  onSelect, 
  placedIds 
}) => {
  return (
    <View className="mt-8">
      <Text className="text-white text-lg font-bold mb-4 ml-2">Available Shapes</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-2"
      >
        {templates.map((shape) => {
          const isPlaced = placedIds.includes(shape.id);
          const isSelected = selectedId === shape.id;

          return (
            <TouchableOpacity
              key={shape.id}
              disabled={isPlaced}
              onPress={() => onSelect(shape.id)}
              className={`mr-4 p-4 rounded-2xl border-2 items-center justify-center min-w-[100px] ${
                isSelected ? 'border-indigo-500 bg-indigo-500/10' : 
                isPlaced ? 'border-slate-800 bg-slate-900 opacity-30' : 
                'border-slate-700 bg-slate-800'
              }`}
            >
              {/* Simple pattern preview using dots */}
              <View className="mb-2 h-12 w-12 items-center justify-center">
                {/* For real production, we'd render the mini-shape here properly. 
                    For now, showing an icon-like name. */}
                <Text className="text-white text-xs font-bold text-center">
                  {shape.name}
                </Text>
              </View>
              {isPlaced && (
                <Text className="text-emerald-500 text-[10px] font-bold uppercase">Placed</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ShapePalette;
