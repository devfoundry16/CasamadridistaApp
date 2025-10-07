import { PenaltyGameProvider, usePenaltyGame } from '@/contexts/PenaltyGameContext';
import type { GoalZone } from '@/types/penalty-game';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { Bot, Target, Trophy, Users } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOAL_ZONES: GoalZone[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

function PenaltyGameContent() {
  const insets = useSafeAreaInsets();
  const { gameState, isConnected, playerId, connectToGame, shoot, disconnect } = usePenaltyGame();
  
  const [showLobby, setShowLobby] = useState(true);
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'single' | 'multiplayer' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [selectedZone, setSelectedZone] = useState<GoalZone | null>(null);
  const [power, setPower] = useState(50);
  const [showResult, setShowResult] = useState(false);
  
  const ballAnimX = useRef(new Animated.Value(0)).current;
  const ballAnimY = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  const handleModeSelect = (mode: 'single' | 'multiplayer') => {
    setSelectedMode(mode);
    setShowModeSelect(false);
  };

  const handleJoinGame = () => {
    if (playerName.trim() && selectedMode) {
      const gameId = 'game-' + Math.random().toString(36).substring(2, 9);
      connectToGame(gameId, playerName.trim(), selectedMode);
      setShowLobby(false);
    }
  };

  const handleZoneSelect = (zone: GoalZone) => {
    setSelectedZone(zone);
  };

  const handleShoot = () => {
    if (!selectedZone || !gameState) return;

    shoot(selectedZone, power);
    animateBall(selectedZone);
    setSelectedZone(null);
  };

  const animateBall = (zone: GoalZone) => {
    const zonePositions: Record<GoalZone, { x: number; y: number }> = {
      'top-left': { x: -SCREEN_WIDTH * 0.25, y: -SCREEN_HEIGHT * 0.3 },
      'top-center': { x: 0, y: -SCREEN_HEIGHT * 0.3 },
      'top-right': { x: SCREEN_WIDTH * 0.25, y: -SCREEN_HEIGHT * 0.3 },
      'middle-left': { x: -SCREEN_WIDTH * 0.25, y: -SCREEN_HEIGHT * 0.15 },
      'middle-center': { x: 0, y: -SCREEN_HEIGHT * 0.15 },
      'middle-right': { x: SCREEN_WIDTH * 0.25, y: -SCREEN_HEIGHT * 0.15 },
      'bottom-left': { x: -SCREEN_WIDTH * 0.25, y: 0 },
      'bottom-center': { x: 0, y: 0 },
      'bottom-right': { x: SCREEN_WIDTH * 0.25, y: 0 },
    };

    const targetPos = zonePositions[zone];

    Animated.parallel([
      Animated.timing(ballAnimX, {
        toValue: targetPos.x,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ballAnimY, {
        toValue: targetPos.y,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(ballScale, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ballScale, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowResult(true);
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(resultOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowResult(false);
          ballAnimX.setValue(0);
          ballAnimY.setValue(0);
          ballScale.setValue(1);
        });
      }, 2500);
    });
  };

  const getZoneStyle = (zone: GoalZone): any => {
    const row = Math.floor(GOAL_ZONES.indexOf(zone) / 3);
    const col = GOAL_ZONES.indexOf(zone) % 3;
    
    return {
      position: 'absolute' as const,
      top: `${row * 33.33}%`,
      left: `${col * 33.33}%`,
      width: '33.33%',
      height: '33.33%',
    };
  };

  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const opponent = gameState?.players.find(p => p.id !== playerId);
  const isMyTurn = gameState?.currentShooterId === playerId;
  const lastRound = gameState?.rounds[gameState.rounds.length - 1];

  if (showLobby) {
    if (showModeSelect) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#001F3F', '#003D7A', '#001F3F']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.lobbyContainer}>
            <View style={styles.lobbyHeader}>
              <Trophy size={64} color="#FFD700" />
              <Text style={styles.lobbyTitle}>Penalty Shootout</Text>
              <Text style={styles.lobbySubtitle}>Choose Game Mode</Text>
            </View>

            <View style={styles.modeSelection}>
              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleModeSelect('single')}
              >
                <Bot size={48} color="#FFD700" />
                <Text style={styles.modeButtonTitle}>Single Player</Text>
                <Text style={styles.modeButtonSubtitle}>Play against AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeButton}
                onPress={() => handleModeSelect('multiplayer')}
              >
                <Users size={48} color="#FFD700" />
                <Text style={styles.modeButtonTitle}>Multiplayer</Text>
                <Text style={styles.modeButtonSubtitle}>Play with friends</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lobbyInfo}>
              <Text style={styles.infoText}>• First to 5 goals wins</Text>
              <Text style={styles.infoText}>• Take turns shooting and goalkeeping</Text>
              <Text style={styles.infoText}>• Choose your zone and power</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#001F3F', '#003D7A', '#001F3F']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.lobbyContainer}>
          <View style={styles.lobbyHeader}>
            {selectedMode === 'single' ? (
              <Bot size={64} color="#FFD700" />
            ) : (
              <Users size={64} color="#FFD700" />
            )}
            <Text style={styles.lobbyTitle}>Penalty Shootout</Text>
            <Text style={styles.lobbySubtitle}>
              {selectedMode === 'single' ? 'Single Player' : 'Multiplayer Challenge'}
            </Text>
          </View>

          <View style={styles.lobbyForm}>
            <Text style={styles.inputLabel}>Enter Your Name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Player Name"
              placeholderTextColor="#666"
              maxLength={20}
            />

            <TouchableOpacity
              style={[styles.joinButton, !playerName.trim() && styles.joinButtonDisabled]}
              onPress={handleJoinGame}
              disabled={!playerName.trim()}
            >
              {selectedMode === 'single' ? (
                <Bot size={24} color="#FFF" />
              ) : (
                <Users size={24} color="#FFF" />
              )}
              <Text style={styles.joinButtonText}>Start Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowModeSelect(true);
                setSelectedMode(null);
              }}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!gameState || !isConnected) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#001F3F', '#003D7A', '#001F3F']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.loadingText}>Connecting to game...</Text>
      </View>
    );
  }

  if (gameState.phase === 'waiting') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#001F3F', '#003D7A', '#001F3F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.waitingContainer}>
          {gameState.mode === 'single' ? (
            <Bot size={64} color="#FFD700" />
          ) : (
            <Users size={64} color="#FFD700" />
          )}
          <Text style={styles.waitingText}>
            {gameState.mode === 'single' ? 'Preparing AI opponent...' : 'Waiting for opponent...'}
          </Text>
          {gameState.mode === 'multiplayer' && (
            <Text style={styles.waitingSubtext}>Game ID: {gameState.gameId}</Text>
          )}
        </View>
      </View>
    );
  }

  if (gameState.phase === 'finished') {
    const isWinner = gameState.winner?.id === playerId;
    
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={isWinner ? ['#004D00', '#006600', '#004D00'] : ['#4D0000', '#660000', '#4D0000']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.finishedContainer}>
          <Trophy size={80} color={isWinner ? '#FFD700' : '#CCC'} />
          <Text style={styles.finishedTitle}>
            {isWinner ? 'Victory!' : 'Defeat'}
          </Text>
          <Text style={styles.finishedScore}>
            {currentPlayer?.score} - {opponent?.score}
          </Text>
          
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => {
              disconnect();
              setShowLobby(true);
              setShowModeSelect(true);
              setSelectedMode(null);
            }}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => router.back()}
          >
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#001F3F', '#003D7A', '#001F3F']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <View style={styles.playerScore}>
            <Text style={styles.playerName}>{currentPlayer?.name}</Text>
            <Text style={styles.score}>{currentPlayer?.score}</Text>
          </View>
          <Text style={styles.scoreSeparator}>-</Text>
          <View style={styles.playerScore}>
            <Text style={styles.playerName}>{opponent?.name}</Text>
            <Text style={styles.score}>{opponent?.score}</Text>
          </View>
        </View>
        
        <Text style={styles.roundText}>
          Round {gameState.currentRound + 1} / {gameState.maxRounds}
        </Text>
      </View>

      <View style={styles.gameArea}>
        <View style={styles.goalContainer}>
          <View style={styles.goalPost} />
          
          <View style={styles.goalZones}>
            {GOAL_ZONES.map((zone) => (
              <TouchableOpacity
                key={zone}
                style={[
                  getZoneStyle(zone),
                  styles.goalZone,
                  selectedZone === zone && styles.goalZoneSelected,
                ]}
                onPress={() => isMyTurn && handleZoneSelect(zone)}
                disabled={!isMyTurn || gameState.phase !== 'ready'}
              >
                <Target
                  size={24}
                  color={selectedZone === zone ? '#FFD700' : '#FFFFFF40'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View
          style={[
            styles.ball,
            {
              transform: [
                { translateX: ballAnimX },
                { translateY: ballAnimY },
                { scale: ballScale },
              ],
            },
          ]}
        />

        {showResult && lastRound && (
          <Animated.View
            style={[
              styles.resultContainer,
              { opacity: resultOpacity },
            ]}
          >
            <Text style={[
              styles.resultText,
              lastRound.isGoal ? styles.goalText : styles.saveText,
            ]}>
              {lastRound.isGoal ? 'GOAL!' : 'SAVED!'}
            </Text>
          </Animated.View>
        )}
      </View>

      {isMyTurn && gameState.phase === 'ready' && (
        <View style={styles.controls}>
          <View style={styles.powerContainer}>
            <Text style={styles.powerLabel}>Power: {power}%</Text>
            <View style={styles.powerBar}>
              <View style={[styles.powerFill, { width: `${power}%` }]} />
            </View>
            <View style={styles.powerButtons}>
              <TouchableOpacity
                style={styles.powerButton}
                onPress={() => setPower(Math.max(0, power - 10))}
              >
                <Text style={styles.powerButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.powerButton}
                onPress={() => setPower(Math.min(100, power + 10))}
              >
                <Text style={styles.powerButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.shootButton, !selectedZone && styles.shootButtonDisabled]}
            onPress={handleShoot}
            disabled={!selectedZone}
          >
            <Text style={styles.shootButtonText}>SHOOT</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isMyTurn && gameState.phase === 'ready' && (
        <View style={styles.waitingTurn}>
          <Text style={styles.waitingTurnText}>Opponent&apos;s Turn</Text>
        </View>
      )}
    </View>
  );
}

export default function PenaltyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <PenaltyGameProvider>
        <PenaltyGameContent />
      </PenaltyGameProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lobbyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lobbyHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lobbyTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 20,
  },
  lobbySubtitle: {
    fontSize: 18,
    color: '#FFD700',
    marginTop: 8,
  },
  lobbyForm: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFF',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF40',
  },
  joinButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  joinButtonDisabled: {
    backgroundColor: '#666',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#001F3F',
  },
  lobbyInfo: {
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 8,
  },
  modeSelection: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF40',
  },
  modeButtonTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
    marginTop: 12,
  },
  modeButtonSubtitle: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  loadingText: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
    marginTop: 20,
  },
  waitingSubtext: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 8,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  finishedTitle: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 20,
  },
  finishedScore: {
    fontSize: 64,
    fontWeight: '800' as const,
    color: '#FFD700',
    marginTop: 20,
  },
  playAgainButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
    minWidth: 200,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#001F3F',
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    minWidth: 200,
  },
  exitText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  playerScore: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 4,
  },
  score: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  scoreSeparator: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  roundText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  goalContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.4,
    position: 'relative' as const,
  },
  goalPost: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderColor: '#FFF',
    borderRadius: 8,
    backgroundColor: '#00000040',
  },
  goalZones: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
  },
  goalZone: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF20',
  },
  goalZoneSelected: {
    backgroundColor: '#FFD70040',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  ball: {
    position: 'absolute' as const,
    bottom: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  resultContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    backgroundColor: '#00000080',
    padding: 20,
    borderRadius: 12,
    minWidth: 200,
  },
  resultText: {
    fontSize: 36,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  goalText: {
    color: '#00FF00',
  },
  saveText: {
    color: '#FF0000',
  },
  controls: {
    padding: 20,
    paddingBottom: 40,
  },
  powerContainer: {
    marginBottom: 20,
  },
  powerLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  powerBar: {
    height: 12,
    backgroundColor: '#FFFFFF20',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  powerFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  powerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  powerButton: {
    backgroundColor: '#FFFFFF20',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerButtonText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  shootButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  shootButtonDisabled: {
    backgroundColor: '#666',
  },
  shootButtonText: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#001F3F',
  },
  waitingTurn: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  waitingTurnText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '600' as const,
  },
});
