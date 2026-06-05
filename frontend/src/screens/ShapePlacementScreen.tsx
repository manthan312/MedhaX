import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { ShapeTemplate, Placement, ShapeCell } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { gameService } from '../services/gameService';
import { lockPlacement, getSocket } from '../services/socket';
import { rotateCells, getAbsoluteCells, isWithinBounds, isOverlapping } from '../utils/placementUtils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'ShapePlacement'>;

const { width } = Dimensions.get('window');

// ─── Shape emoji map ──────────────────────────────────────────────────────────
const SHAPE_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

// ─── Cell component ───────────────────────────────────────────────────────────
interface CellProps {
  x: number;
  y: number;
  state: 'empty' | 'placed' | 'selected-valid' | 'selected-invalid';
  onPress: (x: number, y: number) => void;
  shapeIndex?: number;
  cellSize: number;
}

const GridCell: React.FC<CellProps> = ({ x, y, state, onPress, shapeIndex = 0, cellSize }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress(x, y);
  };

  const bgColor =
    state === 'empty' ? '#1E293B' :
    state === 'placed' ? SHAPE_COLORS[shapeIndex % SHAPE_COLORS.length] :
    state === 'selected-valid' ? '#10B98133' :
    '#EF444433';

  const borderColor =
    state === 'empty' ? '#334155' :
    state === 'placed' ? SHAPE_COLORS[shapeIndex % SHAPE_COLORS.length] + 'cc' :
    state === 'selected-valid' ? '#10B981' :
    '#EF4444';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={{
          width: cellSize,
          height: cellSize,
          margin: 2,
          borderRadius: 6,
          backgroundColor: bgColor,
          borderWidth: state !== 'empty' ? 2 : 1,
          borderColor,
          transform: [{ scale }],
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {state === 'placed' && (
          <View style={{
            width: cellSize * 0.4,
            height: cellSize * 0.4,
            borderRadius: cellSize * 0.2,
            backgroundColor: '#fff4',
          }} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Shape Palette Card ───────────────────────────────────────────────────────
const ShapeCard: React.FC<{
  template: ShapeTemplate;
  isSelected: boolean;
  isPlaced: boolean;
  onSelect: () => void;
  index: number;
}> = ({ template, isSelected, isPlaced, onSelect, index }) => {
  const bounds = useMemo(() => {
    const maxX = Math.max(...template.cells.map((c) => c.x)) + 1;
    const maxY = Math.max(...template.cells.map((c) => c.y)) + 1;
    return { maxX, maxY };
  }, [template]);

  const miniCellSize = 12;
  const color = SHAPE_COLORS[index % SHAPE_COLORS.length];

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={isPlaced}
      style={{
        backgroundColor: isSelected ? color + '22' : '#1E293B',
        borderColor: isSelected ? color : isPlaced ? '#0F172A' : '#334155',
        borderWidth: isSelected ? 2 : 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        width: 90,
        opacity: isPlaced ? 0.35 : 1,
        marginHorizontal: 4,
      }}>
      {/* Mini grid preview */}
      <View style={{ width: bounds.maxX * (miniCellSize + 2), height: bounds.maxY * (miniCellSize + 2) }}>
        {Array.from({ length: bounds.maxY }).map((_, y) => (
          <View key={y} style={{ flexDirection: 'row' }}>
            {Array.from({ length: bounds.maxX }).map((_, x) => {
              const filled = template.cells.some((c) => c.x === x && c.y === y);
              return (
                <View
                  key={x}
                  style={{
                    width: miniCellSize,
                    height: miniCellSize,
                    margin: 1,
                    borderRadius: 3,
                    backgroundColor: filled ? color : '#334155',
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={{ color: isSelected ? color : '#64748B', fontSize: 10, fontWeight: 'bold', marginTop: 6 }}>
        {isPlaced ? '✓ Placed' : template.name}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Main ShapePlacementScreen ────────────────────────────────────────────────

const ShapePlacementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRoute>();
  const { gameId } = route.params;
  const { config, setMyShapes, players } = useGameStore();

  const gridSize = config.gridSize || 5;
  const placementTimeLimit = config.placementTimeLimit || 90;

  const [templates, setTemplates] = useState<ShapeTemplate[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [rotationTimes, setRotationTimes] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponentLocked, setOpponentLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(placementTimeLimit);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const lockAnim = useRef(new Animated.Value(1)).current;

  const cellSize = Math.floor((width - 64) / gridSize) - 4;

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    Animated.timing(timerAnim, {
      toValue: 0,
      duration: placementTimeLimit * 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, []);

  // ── Load templates ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await gameService.getShapeTemplates(gameId);
        setTemplates(data);
      } catch {
        // Use fallback shapes
        setTemplates([
          { id: '1', name: 'L-Shape', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
          { id: '2', name: 'T-Shape', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
          { id: '3', name: 'Zigzag', cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }] },
          { id: '4', name: 'Square', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
        ]);
      } finally {
        setIsLoading(false);
      }
    })();

    // Listen for opponent locked
    const socket = getSocket();
    socket?.on('placement.locked', (_payload: any) => {
      setOpponentLocked(true);
    });

    return () => {
      socket?.off('placement.locked');
    };
  }, [gameId]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const rotatedCells = useMemo(() => selectedTemplate ? rotateCells(selectedTemplate.cells, rotationTimes) : [], [selectedTemplate, rotationTimes]);
  const allPlacedCells = useMemo(() => placements.flatMap((p) => p.cells), [placements]);
  const placedShapeIds = useMemo(() => placements.map((p) => p.shapeId), [placements]);
  const allPlaced = placements.length >= templates.length && templates.length > 0;

  // Determine preview cells + validity
  const previewCells: Array<{ cell: ShapeCell; valid: boolean }> = useMemo(() => {
    if (!hoverCell || !selectedTemplate) return [];
    const absolute = getAbsoluteCells(hoverCell, rotatedCells);
    const inBounds = isWithinBounds(absolute, gridSize);
    const noOverlap = !isOverlapping(absolute, allPlacedCells);
    return absolute.map((c) => ({ cell: c, valid: inBounds && noOverlap }));
  }, [hoverCell, selectedTemplate, rotatedCells, allPlacedCells, gridSize]);

  const getCellState = useCallback((x: number, y: number): { state: CellProps['state']; shapeIndex: number } => {
    // Check if it's a preview cell
    const preview = previewCells.find((p) => p.cell.x === x && p.cell.y === y);
    if (preview) return { state: preview.valid ? 'selected-valid' : 'selected-invalid', shapeIndex: 0 };

    // Check if it's placed
    const placementIndex = placements.findIndex((p) => p.cells.some((c) => c.x === x && c.y === y));
    if (placementIndex >= 0) return { state: 'placed', shapeIndex: placementIndex };

    return { state: 'empty', shapeIndex: 0 };
  }, [previewCells, placements]);

  const handleCellPress = (x: number, y: number) => {
    if (!selectedTemplate) {
      // Remove placed shape if tapping one
      const placementIndex = placements.findIndex((p) => p.cells.some((c) => c.x === x && c.y === y));
      if (placementIndex >= 0) {
        const removed = placements[placementIndex];
        setPlacements(placements.filter((_, i) => i !== placementIndex));
        setSelectedTemplateId(removed.shapeId);
      }
      return;
    }

    setHoverCell({ x, y });
    const absolute = getAbsoluteCells({ x, y }, rotatedCells);
    if (!isWithinBounds(absolute, gridSize)) { return; }
    if (isOverlapping(absolute, allPlacedCells)) { return; }

    setPlacements([...placements, { shapeId: selectedTemplate.id, anchor: { x, y }, cells: absolute }]);
    setSelectedTemplateId(null);
    setHoverCell(null);
    setRotationTimes(0);
  };

  const handleSubmit = async (forced = false) => {
    if (!forced && !allPlaced) return;
    if (isSubmitting) return;

    Animated.sequence([
      Animated.spring(lockAnim, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(lockAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    setIsSubmitting(true);
    try {
      await gameService.submitPlacement(gameId, placements);
      setMyShapes(placements);
      lockPlacement({ matchId: gameId, placements });
    } catch {
      Alert.alert('Error', 'Failed to lock placements. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerPercent = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerColor = timeLeft > 30 ? '#6366F1' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-indigo-400 text-4xl mb-4">⚔️</Text>
        <Text className="text-white font-black text-xl">Setting Battlefield…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      {/* ── Timer Bar ── */}
      <View className="h-1.5 bg-slate-800 w-full">
        <Animated.View style={{ width: timerPercent, backgroundColor: timerColor, height: '100%' }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View className="px-6 pt-4 pb-3 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-black">Position Shapes</Text>
            <Text className="text-slate-400 text-sm">
              {templates.length - placements.length > 0
                ? `Place ${templates.length - placements.length} more shape${templates.length - placements.length > 1 ? 's' : ''}`
                : '✓ All shapes placed!'}
            </Text>
          </View>
          <View className="items-end">
            <Text style={{ color: timerColor }} className="text-3xl font-black">{timeLeft}s</Text>
            <Text className="text-slate-600 text-xs">remaining</Text>
          </View>
        </View>

        {/* ── Opponent Status ── */}
        <View className="px-6 mb-4">
          <View style={{ borderColor: opponentLocked ? '#10B981' + '55' : '#334155' }}
            className="flex-row items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2 border">
            <View style={{ backgroundColor: opponentLocked ? '#10B981' : '#F59E0B' }}
              className="w-2 h-2 rounded-full" />
            <Text className="text-slate-400 text-sm">
              Opponent: {opponentLocked ? '✓ LOCKED IN' : 'Still placing…'}
            </Text>
          </View>
        </View>

        {/* ── Controls Row ── */}
        <View className="px-6 mb-3 flex-row justify-between items-center">
          {/* Rotate */}
          <TouchableOpacity
            onPress={() => setRotationTimes((r) => (r + 1) % 4)}
            disabled={!selectedTemplateId}
            style={{
              backgroundColor: selectedTemplateId ? '#6366F1' + '22' : '#1E293B',
              borderColor: selectedTemplateId ? '#6366F1' : '#334155',
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: selectedTemplateId ? 1 : 0.4,
            }}>
            <Text className="text-lg">↻</Text>
            <Text style={{ color: selectedTemplateId ? '#A5B4FC' : '#475569' }} className="font-bold text-sm">
              Rotate ({rotationTimes * 90}°)
            </Text>
          </TouchableOpacity>

          {/* Undo */}
          <TouchableOpacity
            onPress={() => {
              const removed = placements[placements.length - 1];
              if (removed) {
                setPlacements(placements.slice(0, -1));
                setSelectedTemplateId(removed.shapeId);
              }
            }}
            disabled={placements.length === 0}
            style={{ opacity: placements.length === 0 ? 0.3 : 1 }}
            className="flex-row items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
            <Text className="text-slate-400 text-sm">↩</Text>
            <Text className="text-slate-400 font-bold text-sm">Undo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Grid ── */}
        <View className="px-6 mb-4">
          <View style={{ backgroundColor: '#0F172A', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#1E293B' }}>
            {Array.from({ length: gridSize }).map((_, y) => (
              <View key={y} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {Array.from({ length: gridSize }).map((_, x) => {
                  const { state, shapeIndex } = getCellState(x, y);
                  return (
                    <GridCell
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      state={state}
                      shapeIndex={shapeIndex}
                      onPress={handleCellPress}
                      cellSize={cellSize}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── Shape Palette ── */}
        <View className="px-6 mb-4">
          <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Shape Palette</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.map((template, idx) => (
              <ShapeCard
                key={template.id}
                template={template}
                index={idx}
                isSelected={selectedTemplateId === template.id}
                isPlaced={placedShapeIds.includes(template.id)}
                onSelect={() => {
                  if (selectedTemplateId === template.id) { setSelectedTemplateId(null); return; }
                  setSelectedTemplateId(template.id);
                  setRotationTimes(0);
                  setHoverCell(null);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Lock In Button ── */}
        <View className="px-6 mb-12">
          <Animated.View style={{ transform: [{ scale: lockAnim }] }}>
            <TouchableOpacity
              onPress={() => handleSubmit(false)}
              disabled={!allPlaced || isSubmitting}
              style={{
                backgroundColor: allPlaced ? '#10B981' : '#1E293B',
                borderColor: allPlaced ? '#10B981' : '#334155',
                borderWidth: allPlaced ? 0 : 1,
                shadowColor: allPlaced ? '#10B981' : 'transparent',
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: allPlaced ? 10 : 0,
                borderRadius: 20,
                paddingVertical: 20,
                alignItems: 'center',
                opacity: allPlaced ? 1 : 0.5,
              }}>
              <Text style={{ color: allPlaced ? '#fff' : '#475569' }} className="font-black text-xl tracking-widest">
                {isSubmitting ? '⌛ Locking…' : allPlaced ? '🔒 LOCK IN!' : `Place ${templates.length - placements.length} more`}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShapePlacementScreen;
