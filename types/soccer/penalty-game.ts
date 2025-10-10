export type PlayerRole = 'shooter' | 'goalkeeper';

export type GamePhase = 'waiting' | 'ready' | 'shooting' | 'result' | 'finished';

export type GoalZone = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  role: PlayerRole;
  score: number;
}

export interface Shot {
  zone: GoalZone;
  power: number;
  timestamp: number;
}

export interface Save {
  zone: GoalZone;
  timestamp: number;
}

export interface Round {
  roundNumber: number;
  shooter: Player;
  goalkeeper: Player;
  shot?: Shot;
  save?: Save;
  isGoal: boolean;
  timestamp: number;
}

export type GameMode = 'single' | 'multiplayer';

export interface GameState {
  gameId: string;
  phase: GamePhase;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  rounds: Round[];
  winner?: Player;
  currentShooterId?: string;
  currentGoalkeeperId?: string;
  mode: GameMode;
}

export interface WebSocketMessage {
  type: 'join' | 'ready' | 'shoot' | 'save' | 'round-result' | 'game-over' | 'player-joined' | 'player-left' | 'error';
  payload: any;
  gameId: string;
  playerId: string;
  timestamp: number;
}
