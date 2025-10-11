import { Ball } from '@/components/Penalty/Ball';
import { Button } from '@/components/Penalty/Button';
import { Goal } from '@/components/Penalty/Goal';
import { Player } from '@/components/Penalty/Player';
import { GameState, Player as PlayerType } from '@/types/penalty/game';
import { calculateShot, moveGoalkeeper } from '@/utils/penalty/physics';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  players: PlayerType[];
  onGameEnd: (finalPlayers: PlayerType[]) => void;
  isMultiplayer?: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({
  players,
  onGameEnd,
  isMultiplayer = false,
}) => {
  const [gameState, setGameState] = useState<GameState>({
    players: players.map(p => ({ ...p, score: 0 })),
    currentPlayer: 0,
    ballPosition: { x: width / 2, y: height - 100 },
    goalkeeperPosition: { x: 150, y: 100 },
    isShooting: false,
    isGoal: null,
    gameStarted: true,
  });

  const handleGoalPress = useCallback((event: any) => {
    if (gameState.isShooting) return;

    const { locationX, locationY } = event.nativeEvent;
    const goalAreaX = (width - 300) / 2; // Center the goal
    const goalAreaY = 100;

    const targetX = locationX - goalAreaX;
    const targetY = locationY - goalAreaY;

    setGameState(prev => ({ ...prev, isShooting: true }));

    // Animate shot
    setTimeout(() => {
      const shotResult = calculateShot(targetX, targetY, gameState.goalkeeperPosition);
      
      setGameState(prev => ({
        ...prev,
        ballPosition: { 
          x: goalAreaX + shotResult.position.x, 
          y: goalAreaY + shotResult.position.y 
        },
        isGoal: shotResult.isGoal,
      }));

      // Update score and move to next player
      setTimeout(() => {
        const updatedPlayers = [...gameState.players];
        if (shotResult.isGoal) {
          updatedPlayers[gameState.currentPlayer].score += 1;
        }

        const nextPlayer = (gameState.currentPlayer + 1) % players.length;
        
        setGameState(prev => ({
          ...prev,
          players: updatedPlayers,
          currentPlayer: nextPlayer,
          isShooting: false,
          isGoal: null,
          ballPosition: { x: width / 2, y: height - 100 },
          goalkeeperPosition: moveGoalkeeper(prev.goalkeeperPosition),
        }));

        // Check if game should end (5 shots per player)
        if (updatedPlayers.every(player => player.score >= 5) || 
            updatedPlayers.reduce((total, player) => total + player.score, 0) >= players.length * 5) {
          onGameEnd(updatedPlayers);
        }
      }, 1500);
    }, 500);
  }, [gameState, players.length]);

  const currentPlayer = gameState.players[gameState.currentPlayer];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Penalty Shootout</Text>
      
      <View style={styles.playersContainer}>
        {gameState.players.map((player, index) => (
          <Player
            key={player.id}
            player={player}
            isCurrent={index === gameState.currentPlayer}
          />
        ))}
      </View>

      <Text style={styles.turnText}>
        {currentPlayer.name}'s turn
      </Text>

      <TouchableWithoutFeedback onPress={handleGoalPress}>
        <View style={styles.goalContainer}>
          <Goal goalkeeperPosition={gameState.goalkeeperPosition} />
          <Ball
            position={gameState.ballPosition}
            visible={!gameState.isShooting}
          />
        </View>
      </TouchableWithoutFeedback>

      {gameState.isGoal !== null && (
        <Text style={[styles.resultText, gameState.isGoal ? styles.goalText : styles.missText]}>
          {gameState.isGoal ? 'GOAL! 🎉' : 'MISS! ❌'}
        </Text>
      )}

      <View style={styles.controls}>
        <Button
          title="End Game"
          onPress={() => onGameEnd(gameState.players)}
          variant="secondary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 10,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  turnText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  goalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  goalText: {
    color: '#4CAF50',
  },
  missText: {
    color: '#F44336',
  },
  controls: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default GameScreen;