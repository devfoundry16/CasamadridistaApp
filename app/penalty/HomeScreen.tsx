import { Button } from '@/components/Penalty/Button';
import { Player } from '@/types/penalty/game';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

interface HomeScreenProps {
  onStartSinglePlayer: (player: Player) => void;
  onStartMultiplayer: (players: Player[]) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartSinglePlayer,
  onStartMultiplayer,
}) => { 
  const [playerName, setPlayerName] = useState('Player 1');
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', score: 0 },
    { id: '2', name: 'Player 2', score: 0 },
  ]);

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...multiplayerPlayers];
    updated[index].name = name;
    setMultiplayerPlayers(updated);
  };

  const addPlayer = () => {
    if (multiplayerPlayers.length >= 4) {
      Alert.alert('Maximum 4 players allowed');
      return;
    }
    
    setMultiplayerPlayers(prev => [
      ...prev,
      { id: Date.now().toString(), name: `Player ${prev.length + 1}`, score: 0 },
    ]);
  };

  const removePlayer = (index: number) => {
    if (multiplayerPlayers.length <= 2) {
      Alert.alert('Minimum 2 players required');
      return;
    }
    
    setMultiplayerPlayers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Soccer Penalty</Text>
      <Text style={styles.subtitle}>Test your penalty skills!</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Single Player</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name"
        />
        <Button
          title="Start Single Player"
          onPress={() => onStartSinglePlayer({
            id: '1',
            name: playerName,
            score: 0,
          })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multiplayer</Text>
        
        {multiplayerPlayers.map((player, index) => (
          <View key={player.id} style={styles.playerInputRow}>
            <TextInput
              style={[styles.input, styles.multiplayerInput]}
              value={player.name}
              onChangeText={(text) => updatePlayerName(index, text)}
              placeholder={`Player ${index + 1}`}
            />
            {multiplayerPlayers.length > 2 && (
              <Button
                title="Remove"
                onPress={() => removePlayer(index)}
                variant="secondary"
              />
            )}
          </View>
        ))}
        
        <View style={styles.multiplayerButtons}>
          {multiplayerPlayers.length < 4 && (
            <Button
              title="Add Player"
              onPress={addPlayer}
              variant="secondary"
            />
          )}
          <Button
            title="Start Multiplayer"
            onPress={() => onStartMultiplayer(multiplayerPlayers)}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  multiplayerInput: {
    flex: 1,
    marginRight: 10,
  },
  playerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  multiplayerButtons: {
    marginTop: 10,
  },
});

export default HomeScreen;