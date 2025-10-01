import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import {altColors} from '@/constants/colors';

interface Player {
  id: number;
  name: string;
  position: string;
  number: number;
  imageUrl: string;
  nationality: string;
}

const REAL_MADRID_SQUAD: Player[] = [
  { id: 1, name: 'Thibaut Courtois', position: 'Goalkeeper', number: 1, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Belgium' },
  { id: 2, name: 'Dani Carvajal', position: 'Defender', number: 2, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Spain' },
  { id: 3, name: 'Éder Militão', position: 'Defender', number: 3, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Brazil' },
  { id: 4, name: 'David Alaba', position: 'Defender', number: 4, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Austria' },
  { id: 5, name: 'Jude Bellingham', position: 'Midfielder', number: 5, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'England' },
  { id: 6, name: 'Federico Valverde', position: 'Midfielder', number: 8, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Uruguay' },
  { id: 7, name: 'Luka Modrić', position: 'Midfielder', number: 10, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Croatia' },
  { id: 8, name: 'Vinícius Jr.', position: 'Forward', number: 7, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Brazil' },
  { id: 9, name: 'Kylian Mbappé', position: 'Forward', number: 9, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'France' },
  { id: 10, name: 'Rodrygo', position: 'Forward', number: 11, imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400', nationality: 'Brazil' },
];

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const colors = altColors;

  const renderPlayer = ({ item }: { item: Player }) => (
    <Pressable
      style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.playerImage} />
      <View style={styles.playerNumber}>
        <Text style={[styles.playerNumberText, { color: colors.primary }]}>{item.number}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.playerPosition, { color: colors.textSecondary }]}>{item.position}</Text>
        <Text style={[styles.playerNationality, { color: colors.textSecondary }]}>{item.nationality}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: 12}]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Real Madrid Squad</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>2024-2025 Season</Text>
      </View>
      <FlatList
        data={REAL_MADRID_SQUAD}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.playersList}
        columnWrapperStyle={styles.columnWrapper}
      />
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
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  playersList: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  playerImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  playerNumber: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  playerInfo: {
    padding: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 12,
    marginBottom: 2,
  },
  playerNationality: {
    fontSize: 11,
  },
});
