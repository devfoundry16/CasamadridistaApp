import { Player } from '@/types/penalty/game';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import GameScreen from '../penalty/GameScreen';
import HomeScreen from '../penalty/HomeScreen';

type Screen = 'home' | 'game';

export default function PenaltyScreen() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  const handleStartSinglePlayer = useCallback((player: Player) => {
    setGamePlayers([player, {
      id: 'ai',
      name: 'AI Goalkeeper',
      score: 0,
    }]);
    setIsMultiplayer(false);
    setCurrentScreen('game');
  }, []);

  const handleStartMultiplayer = useCallback((players: Player[]) => {
    setGamePlayers(players);
    setIsMultiplayer(true);
    setCurrentScreen('game');
  }, []);

  const handleGameEnd = useCallback((finalPlayers: Player[]) => {
    const winner = finalPlayers.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    Alert.alert(
      'Game Over!',
      `Winner: ${winner.name} with ${winner.score} goals!`,
      [
        {
          text: 'Back to Menu',
          onPress: () => setCurrentScreen('home'),
        },
      ]
    );
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onStartSinglePlayer={handleStartSinglePlayer}
            onStartMultiplayer={handleStartMultiplayer}
          />
        );
      case 'game':
        return (
          <GameScreen
            players={gamePlayers}
            onGameEnd={handleGameEnd}
            isMultiplayer={isMultiplayer}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});