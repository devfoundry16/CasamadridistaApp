export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  players: Player[];
  currentPlayer: number;
  ballPosition: { x: number; y: number };
  goalkeeperPosition: { x: number; y: number };
  isShooting: boolean;
  isGoal: boolean | null;
  gameStarted: boolean;
}

export interface ShotResult {
  isGoal: boolean;
  position: { x: number; y: number };
}