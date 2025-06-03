export type RingSize = 'small' | 'medium' | 'large';
export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export interface Ring {
  id: string;
  size: RingSize;
  color: PlayerColor;
}

export interface Cell {
  id: string;
  row: number;
  col: number;
  rings: Ring[];
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  rings: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface GameState {
  board: Cell[][];
  players: Player[];
  currentPlayerIndex: number;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  winningCells: string[] | null;
  selectedRingSize: RingSize | null;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  gameState: GameState | null;
  maxPlayers: number;
}