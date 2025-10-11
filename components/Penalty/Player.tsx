import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PlayerProps {
  player: {
    id: string;
    name: string;
    score: number;
  };
  isCurrent: boolean;
}

export const Player: React.FC<PlayerProps> = ({ player, isCurrent }) => {
  return (
    <View style={[styles.container, isCurrent && styles.currentPlayer]}>
      <Text style={styles.name}>{player.name}</Text>
      <Text style={styles.score}>Score: {player.score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    margin: 5,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  currentPlayer: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  score: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});