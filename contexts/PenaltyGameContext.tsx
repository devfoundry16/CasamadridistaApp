import type { GameMode, GameState, GoalZone, Player, WebSocketMessage } from '@/types/penalty-game';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const MOCK_MODE = true;

export const [PenaltyGameProvider, usePenaltyGame] = createContextHook(() => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const initializeMockGame = useCallback((playerName: string, mode: GameMode) => {
    const newPlayerId = generateId();
    setPlayerId(newPlayerId);

    const mockGameState: GameState = {
      gameId: generateId(),
      phase: 'ready',
      players: [
        {
          id: newPlayerId,
          name: playerName,
          role: 'shooter',
          score: 0,
        },
      ],
      currentRound: 0,
      maxRounds: 5,
      rounds: [],
      mode,
    };

    setGameState(mockGameState);
    setIsConnected(true);
    console.log('[Mock] Game initialized:', mockGameState);
  }, []);

  const addMockOpponent = useCallback((isAI: boolean = false) => {
    if (!gameState) return;

    const opponentId = generateId();
    const updatedPlayers: Player[] = [
      ...gameState.players,
      {
        id: opponentId,
        name: isAI ? 'AI Opponent' : 'Opponent',
        role: 'goalkeeper',
        score: 0,
      },
    ];

    setGameState({
      ...gameState,
      players: updatedPlayers,
      phase: 'ready',
      currentShooterId: gameState.players[0].id,
      currentGoalkeeperId: opponentId,
    });

    console.log('[Mock] Opponent added:', isAI ? 'AI' : 'Human');
  }, [gameState]);

  const connectToGame = useCallback((gameId: string, playerName: string, mode: GameMode = 'multiplayer') => {
    if (MOCK_MODE || mode === 'single') {
      initializeMockGame(playerName, mode);
      setTimeout(() => addMockOpponent(mode === 'single'), mode === 'single' ? 500 : 2000);
      return;
    }

    if (Platform.OS === 'web') {
      try {
        const ws = new WebSocket(`wss://your-game-server.com/game/${gameId}`);
        
        ws.onopen = () => {
          console.log('[WS] Connected to game server');
          setIsConnected(true);
          
          const joinMessage: WebSocketMessage = {
            type: 'join',
            payload: { playerName },
            gameId,
            playerId: generateId(),
            timestamp: Date.now(),
          };
          
          ws.send(JSON.stringify(joinMessage));
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('[WS] Message received:', message);
            
            switch (message.type) {
              case 'player-joined':
                setGameState(message.payload.gameState);
                setPlayerId(message.payload.playerId);
                break;
              case 'ready':
                setGameState(message.payload.gameState);
                break;
              case 'round-result':
                setGameState(message.payload.gameState);
                break;
              case 'game-over':
                setGameState(message.payload.gameState);
                break;
              case 'error':
                setError(message.payload.error);
                break;
            }
          } catch (err) {
            console.error('[WS] Error parsing message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          setError('Connection error');
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('[WS] Connection closed');
          setIsConnected(false);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WS] Attempting to reconnect...');
            connectToGame(gameId, playerName);
          }, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('[WS] Connection failed:', err);
        setError('Failed to connect to game server');
      }
    } else {
      setError('Multiplayer is only available on web');
    }
  }, [initializeMockGame, addMockOpponent]);

  const shoot = useCallback((zone: GoalZone, power: number) => {
    if (!gameState || !playerId) return;

    console.log('[Game] Shooting at zone:', zone, 'with power:', power);

    if (MOCK_MODE || gameState.mode === 'single') {
      const aiDiveZone = getAIDiveZone(zone, power);
      const isGoal = aiDiveZone !== zone;
      
      const newRound = {
        roundNumber: gameState.currentRound + 1,
        shooter: gameState.players.find(p => p.id === playerId)!,
        goalkeeper: gameState.players.find(p => p.id !== playerId)!,
        shot: { zone, power, timestamp: Date.now() },
        isGoal,
        timestamp: Date.now(),
      };

      const updatedPlayers = gameState.players.map(p => {
        if (p.id === playerId && isGoal) {
          return { ...p, score: p.score + 1 };
        }
        return p;
      });

      const newRoundNumber = gameState.currentRound + 1;
      const isGameFinished = newRoundNumber >= gameState.maxRounds;

      setGameState({
        ...gameState,
        phase: 'result',
        players: updatedPlayers,
        currentRound: newRoundNumber,
        rounds: [...gameState.rounds, newRound],
        winner: isGameFinished 
          ? updatedPlayers.reduce((prev, current) => 
              (prev.score > current.score) ? prev : current
            )
          : undefined,
      });

      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          
          if (isGameFinished) {
            return { ...prev, phase: 'finished' };
          }
          
          if (prev.mode === 'single') {
            simulateAITurn(prev);
          }
          
          return {
            ...prev,
            phase: 'ready',
          };
        });
      }, 3000);

      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'shoot',
        payload: { zone, power },
        gameId: gameState.gameId,
        playerId,
        timestamp: Date.now(),
      };
      
      wsRef.current.send(JSON.stringify(message));
    }
  }, [gameState, playerId]);

  const saveShot = useCallback((zone: GoalZone) => {
    if (!gameState || !playerId) return;

    console.log('[Game] Goalkeeper diving to zone:', zone);

    if (MOCK_MODE) {
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'save',
        payload: { zone },
        gameId: gameState.gameId,
        playerId,
        timestamp: Date.now(),
      };
      
      wsRef.current.send(JSON.stringify(message));
    }
  }, [gameState, playerId]);

  const getAIDiveZone = (shotZone: GoalZone, power: number): GoalZone => {
    const difficulty = 0.6;
    const willGuessCorrectly = Math.random() < difficulty;
    
    if (willGuessCorrectly) {
      return shotZone;
    }
    
    const zones: GoalZone[] = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right',
    ];
    
    const otherZones = zones.filter(z => z !== shotZone);
    return otherZones[Math.floor(Math.random() * otherZones.length)];
  };

  const simulateAITurn = (currentState: GameState) => {
    setTimeout(() => {
      const aiPlayer = currentState.players.find(p => p.name === 'AI Opponent');
      if (!aiPlayer) return;

      const zones: GoalZone[] = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right',
      ];
      
      const aiZone = zones[Math.floor(Math.random() * zones.length)];
      const aiPower = 50 + Math.floor(Math.random() * 50);
      
      const playerDiveZone = zones[Math.floor(Math.random() * zones.length)];
      const isAIGoal = playerDiveZone !== aiZone;
      
      const newRound = {
        roundNumber: currentState.currentRound + 1,
        shooter: aiPlayer,
        goalkeeper: currentState.players.find(p => p.id !== aiPlayer.id)!,
        shot: { zone: aiZone, power: aiPower, timestamp: Date.now() },
        isGoal: isAIGoal,
        timestamp: Date.now(),
      };

      const updatedPlayers = currentState.players.map(p => {
        if (p.id === aiPlayer.id && isAIGoal) {
          return { ...p, score: p.score + 1 };
        }
        return p;
      });

      const newRoundNumber = currentState.currentRound + 1;
      const isGameFinished = newRoundNumber >= currentState.maxRounds;

      setGameState({
        ...currentState,
        phase: 'result',
        players: updatedPlayers,
        currentRound: newRoundNumber,
        rounds: [...currentState.rounds, newRound],
        winner: isGameFinished 
          ? updatedPlayers.reduce((prev, current) => 
              (prev.score > current.score) ? prev : current
            )
          : undefined,
      });

      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            phase: isGameFinished ? 'finished' : 'ready',
          };
        });
      }, 3000);
    }, 2000);
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setGameState(null);
    setPlayerId('');
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    gameState,
    isConnected,
    playerId,
    error,
    connectToGame,
    shoot,
    saveShot,
    disconnect,
  };
});
