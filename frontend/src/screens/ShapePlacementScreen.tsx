import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types/navigation';
import { ShapeTemplate, Placement, ShapeCell } from '../types/game';
import { gameService } from '../services/gameService';
import PlacementGrid from '../components/game/PlacementGrid';
import ShapePalette from '../components/game/ShapePalette';
import { rotateCells, getAbsoluteCells, isWithinBounds, isOverlapping } from '../utils/placementUtils';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ShapePlacement'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ShapePlacement'>;

const ShapePlacementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { gameId } = route.params;

  const [templates, setTemplates] = useState<ShapeTemplate[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [rotationTimes, setRotationTimes] = useState(0);
  const [gridSize, setGridSize] = useState(10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await gameService.getShapeTemplates(gameId);
        setTemplates(data);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch shape templates.');
      } finally {
        setIsLoading(false);
      }
    }, [gameId]);
    fetchData();
  }, [gameId]);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId), 
    [templates, selectedTemplateId]
  );

  const rotatedCells = useMemo(() => 
    selectedTemplate ? rotateCells(selectedTemplate.cells, rotationTimes) : [],
    [selectedTemplate, rotationTimes]
  );

  const allPlacedCells = useMemo(() => 
    placements.flatMap(p => p.cells),
    [placements]
  );

  const handleCellPress = (x: number, y: number) => {
    if (!selectedTemplate) return;

    const anchor = { x, y };
    const absoluteCells = getAbsoluteCells(anchor, rotatedCells);

    if (!isWithinBounds(absoluteCells, gridSize)) {
      Alert.alert('Invalid Placement', 'The shape is out of bounds!');
      return;
    }

    if (isOverlapping(absoluteCells, allPlacedCells)) {
      Alert.alert('Invalid Placement', 'Shapes cannot overlap!');
      return;
    }

    // Success: Place the shape
    const newPlacement: Placement = {
      shapeId: selectedTemplate.id,
      anchor,
      cells: absoluteCells,
    };

    setPlacements([...placements, newPlacement]);
    setSelectedTemplateId(null);
    setRotationTimes(0);
  };

  const handleRotate = () => {
    setRotationTimes(prev => (prev + 1) % 4);
  };

  const handleUndo = () => {
    setPlacements(placements.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (placements.length < templates.length) {
      Alert.alert('Incomplete', `Please place all ${templates.length} shapes before confirming.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await gameService.submitPlacement(gameId, placements);
      setIsWaitingForOpponent(true);
    } catch (err) {
      Alert.alert('Submission Error', 'Failed to submit placements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-slate-400 mt-4">Loading Battlefield...</Text>
      </View>
    );
  }

  if (isWaitingForOpponent) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-10">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-white text-2xl font-bold mt-8 text-center">Waiting for Opponent</Text>
        <Text className="text-slate-400 text-center mt-4">
          Both players must confirm their placements before the quiz starts.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Game', { gameId })}
          className="mt-12 opacity-50"
        >
          <Text className="text-indigo-500 font-bold">Simulator: Force Proceed →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-end mb-6 px-2">
          <View>
            <Text className="text-white text-3xl font-black">Position Shapes</Text>
            <Text className="text-slate-400 font-medium">Place {templates.length - placements.length} more</Text>
          </View>
          <TouchableOpacity 
            onPress={handleRotate} 
            disabled={!selectedTemplateId}
            className={`p-3 rounded-full border-2 ${selectedTemplateId ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 opacity-20'}`}
          >
            <Text className="text-indigo-400 font-bold">Rotate ↻</Text>
          </TouchableOpacity>
        </View>

        <PlacementGrid 
          gridSize={gridSize}
          placements={allPlacedCells}
          onCellPress={handleCellPress}
        />

        <ShapePalette
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
          placedIds={placements.map(p => p.shapeId)}
        />

        <View className="flex-row space-x-3 mt-auto mb-8 px-2">
          <TouchableOpacity 
            onPress={handleUndo}
            disabled={placements.length === 0}
            className={`flex-1 py-4 rounded-2xl items-center border-2 border-slate-700 ${placements.length === 0 ? 'opacity-30' : ''}`}
          >
            <Text className="text-slate-400 font-bold">Undo Last</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={isSubmitting || placements.length < templates.length}
            className={`flex-1 py-4 rounded-2xl items-center bg-indigo-600 shadow-lg shadow-indigo-500/20 ${
              (isSubmitting || placements.length < templates.length) ? 'opacity-50' : ''
            }`}
          >
            {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold text-lg">Confirm</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ShapePlacementScreen;
