import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCcw, Save } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import {altColors} from '@/constants/colors';

interface Position {
  id: string;
  x: number;
  y: number;
  player: string;
}

const FORMATIONS = {
  '4-3-3': [
    { id: 'gk', x: 50, y: 90, player: 'GK' },
    { id: 'lb', x: 15, y: 70, player: 'LB' },
    { id: 'cb1', x: 38, y: 70, player: 'CB' },
    { id: 'cb2', x: 62, y: 70, player: 'CB' },
    { id: 'rb', x: 85, y: 70, player: 'RB' },
    { id: 'cm1', x: 30, y: 45, player: 'CM' },
    { id: 'cm2', x: 50, y: 45, player: 'CM' },
    { id: 'cm3', x: 70, y: 45, player: 'CM' },
    { id: 'lw', x: 15, y: 20, player: 'LW' },
    { id: 'st', x: 50, y: 15, player: 'ST' },
    { id: 'rw', x: 85, y: 20, player: 'RW' },
  ],
  '4-4-2': [
    { id: 'gk', x: 50, y: 90, player: 'GK' },
    { id: 'lb', x: 15, y: 70, player: 'LB' },
    { id: 'cb1', x: 38, y: 70, player: 'CB' },
    { id: 'cb2', x: 62, y: 70, player: 'CB' },
    { id: 'rb', x: 85, y: 70, player: 'RB' },
    { id: 'lm', x: 15, y: 45, player: 'LM' },
    { id: 'cm1', x: 38, y: 45, player: 'CM' },
    { id: 'cm2', x: 62, y: 45, player: 'CM' },
    { id: 'rm', x: 85, y: 45, player: 'RM' },
    { id: 'st1', x: 35, y: 15, player: 'ST' },
    { id: 'st2', x: 65, y: 15, player: 'ST' },
  ],
};

export default function FormationScreen() {
  const insets = useSafeAreaInsets();
  const colors = altColors;
  const [selectedFormation, setSelectedFormation] = useState<'4-3-3' | '4-4-2'>('4-3-3');
  const [positions, setPositions] = useState<Position[]>(FORMATIONS['4-3-3']);

  const handleFormationChange = (formation: '4-3-3' | '4-4-2') => {
    setSelectedFormation(formation);
    setPositions(FORMATIONS[formation]);
  };

  const handleReset = () => {
    setPositions(FORMATIONS[selectedFormation]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Formation Builder</Text>
        <View style={styles.formationSelector}>
          <Pressable
            style={[
              styles.formationButton,
              {
                backgroundColor: selectedFormation === '4-3-3' ? colors.primary : colors.backgroundSecondary,
                borderColor: selectedFormation === '4-3-3' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleFormationChange('4-3-3')}
          >
            <Text
              style={[
                styles.formationButtonText,
                { color: selectedFormation === '4-3-3' ? colors.secondary : colors.text },
              ]}
            >
              4-3-3
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.formationButton,
              {
                backgroundColor: selectedFormation === '4-4-2' ? colors.primary : colors.backgroundSecondary,
                borderColor: selectedFormation === '4-4-2' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleFormationChange('4-4-2')}
          >
            <Text
              style={[
                styles.formationButtonText,
                { color: selectedFormation === '4-4-2' ? colors.secondary : colors.text },
              ]}
            >
              4-4-2
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.pitch, { backgroundColor: '#2D5016' }]}>
          <View style={[styles.pitchLine, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
          <View style={[styles.centerCircle, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
          <View style={[styles.penaltyBox, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />
          <View style={[styles.goalBox, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />

          {positions.map((pos) => (
            <View
              key={pos.id}
              style={[
                styles.playerPosition,
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.playerPositionText, { color: colors.secondary }]}>{pos.player}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleReset}
          >
            <RotateCcw size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Reset</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Save size={20} color={colors.secondary} />
            <Text style={[styles.actionButtonText, { color: colors.secondary }]}>Save Formation</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  formationSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  formationButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  formationButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    padding: 16,
  },
  pitch: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  pitchLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    borderTopWidth: 2,
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  penaltyBox: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    width: '60%',
    height: '20%',
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  goalBox: {
    position: 'absolute',
    bottom: 0,
    left: '35%',
    width: '30%',
    height: '10%',
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  playerPosition: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  playerPositionText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
