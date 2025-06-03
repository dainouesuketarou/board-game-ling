import { v4 as uuidv4 } from 'uuid';
import { Cell, GameState, Player, PlayerColor, Ring, RingSize } from '../types/game';

// 色の配列
const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

// ルームIDを生成する
export const generateRoomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 新しいプレイヤーを作成する
export const createPlayer = (name: string, color: PlayerColor): Player => {
  return {
    id: uuidv4(),
    name,
    color,
    rings: {
      small: 3,
      medium: 3,
      large: 3,
    },
  };
};

// 初期ゲーム状態を作成する
export const createInitialGameState = (players: Player[]): GameState => {
  // プレイヤーの順番をランダムに決める
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // 3x3のボードを作成する
  const board: Cell[][] = Array(3)
    .fill(null)
    .map((_, row) =>
      Array(3)
        .fill(null)
        .map((_, col) => ({
          id: `cell-${row}-${col}`,
          row,
          col,
          rings: [],
        }))
    );

  return {
    board,
    players: shuffledPlayers,
    currentPlayerIndex: 0,
    gameStatus: 'playing',
    winner: null,
    winningCells: null,
    selectedRingSize: null,
  };
};

// リングを配置する
export const placeRing = (
  gameState: GameState,
  cellId: string,
  ringSize: RingSize
): GameState => {
  const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
  
  // プレイヤーが選択したサイズのリングを持っているか確認
  if (currentPlayer.rings[ringSize] <= 0) {
    return gameState;
  }

  // セルを見つける
  let targetCell: Cell | null = null;
  let row = -1;
  let col = -1;

  for (let i = 0; i < newGameState.board.length; i++) {
    for (let j = 0; j < newGameState.board[i].length; j++) {
      if (newGameState.board[i][j].id === cellId) {
        targetCell = newGameState.board[i][j];
        row = i;
        col = j;
        break;
      }
    }
    if (targetCell) break;
  }

  if (!targetCell) return gameState;

  // 同じサイズのリングが既に存在するか確認
  if (targetCell.rings.some((ring) => ring.size === ringSize)) {
    return gameState;
  }

  // リングを配置
  const newRing: Ring = {
    id: uuidv4(),
    size: ringSize,
    color: currentPlayer.color,
  };

  targetCell.rings.push(newRing);
  
  // プレイヤーのリングを減らす
  currentPlayer.rings[ringSize]--;

  // 勝利条件を確認
  const { winner, winningCells } = checkWinConditions(newGameState, row, col);
  
  if (winner) {
    newGameState.winner = winner;
    newGameState.winningCells = winningCells;
    newGameState.gameStatus = 'finished';
    return newGameState;
  }

  // 次のプレイヤーに進む
  newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
  newGameState.selectedRingSize = null;
  
  return newGameState;
};

// 勝利条件をチェックする
export const checkWinConditions = (
  gameState: GameState,
  placedRow: number,
  placedCol: number
): { winner: Player | null; winningCells: string[] | null } => {
  const { board, players } = gameState;
  
  // 1. 同じマスに同じ色のリングを3つ置いた場合
  const cellRings = board[placedRow][placedCol].rings;
  const cellRingsByColor = groupRingsByColor(cellRings);
  
  for (const color in cellRingsByColor) {
    if (cellRingsByColor[color].length === 3) {
      const winner = players.find((p) => p.color === color);
      if (winner) {
        return {
          winner,
          winningCells: [board[placedRow][placedCol].id],
        };
      }
    }
  }

  // 2. 横、縦、斜めに同じ色のリングが大きい順または小さい順に並んでいる場合
  const lines = [
    // 横の行
    [...Array(3)].map((_, col) => ({ row: placedRow, col })),
    // 縦の列
    [...Array(3)].map((_, row) => ({ row, col: placedCol })),
  ];

  // 斜めのラインを追加（対角線上にある場合のみ）
  if (placedRow === placedCol) {
    lines.push([...Array(3)].map((_, i) => ({ row: i, col: i })));
  }
  if (placedRow + placedCol === 2) {
    lines.push([...Array(3)].map((_, i) => ({ row: i, col: 2 - i })));
  }

  for (const line of lines) {
    const lineResult = checkLineForSizeSortedRings(board, line, players);
    if (lineResult.winner) {
      return lineResult;
    }
  }

  // 3. 横、縦、斜めに同じ色、同じサイズのリングが並んでいる場合
  for (const line of lines) {
    const lineResult = checkLineForSameSizeRings(board, line, players);
    if (lineResult.winner) {
      return lineResult;
    }
  }

  return { winner: null, winningCells: null };
};

// リングを色ごとにグループ化する
const groupRingsByColor = (rings: Ring[]): Record<string, Ring[]> => {
  return rings.reduce((acc, ring) => {
    if (!acc[ring.color]) {
      acc[ring.color] = [];
    }
    acc[ring.color].push(ring);
    return acc;
  }, {} as Record<string, Ring[]>);
};

// 同じ色のリングが大きい順または小さい順に並んでいるかをチェック
const checkLineForSizeSortedRings = (
  board: Cell[][],
  line: { row: number; col: number }[],
  players: Player[]
): { winner: Player | null; winningCells: string[] | null } => {
  const ringsByColor: Record<PlayerColor, { size: RingSize; cellId: string }[]> = {} as Record<
    PlayerColor,
    { size: RingSize; cellId: string }[]
  >;

  // 各マスのリングを色ごとに収集
  for (const { row, col } of line) {
    const cell = board[row][col];
    
    for (const ring of cell.rings) {
      if (!ringsByColor[ring.color]) {
        ringsByColor[ring.color] = [];
      }
      ringsByColor[ring.color].push({ size: ring.size, cellId: cell.id });
    }
  }

  // 各色について大きい順または小さい順にリングが並んでいるかチェック
  for (const color in ringsByColor) {
    const rings = ringsByColor[color as PlayerColor];
    
    if (rings.length === 3) {
      const sizesMap = { small: 0, medium: 1, large: 2 };
      const sizes = rings.map((r) => sizesMap[r.size]);
      
      // 昇順または降順にソートして、元の配列と比較
      const sortedAsc = [...sizes].sort((a, b) => a - b);
      const sortedDesc = [...sizes].sort((a, b) => b - a);
      
      if (
        (JSON.stringify(sizes) === JSON.stringify(sortedAsc) ||
          JSON.stringify(sizes) === JSON.stringify(sortedDesc)) &&
        // すべての値が異なることを確認（重複がないこと）
        new Set(sizes).size === 3
      ) {
        const winner = players.find((p) => p.color === color);
        if (winner) {
          return {
            winner,
            winningCells: rings.map((r) => r.cellId),
          };
        }
      }
    }
  }

  return { winner: null, winningCells: null };
};

// 同じ色、同じサイズのリングが一列に並んでいるかをチェック
const checkLineForSameSizeRings = (
  board: Cell[][],
  line: { row: number; col: number }[],
  players: Player[]
): { winner: Player | null; winningCells: string[] | null } => {
  // サイズごとにリングをグループ化
  const ringsBySizeAndColor: Record<RingSize, Record<PlayerColor, string[]>> = {
    small: {},
    medium: {},
    large: {},
  } as Record<RingSize, Record<PlayerColor, string[]>>;

  // 各マスのリングを収集
  for (const { row, col } of line) {
    const cell = board[row][col];
    
    for (const ring of cell.rings) {
      if (!ringsBySizeAndColor[ring.size][ring.color]) {
        ringsBySizeAndColor[ring.size][ring.color] = [];
      }
      ringsBySizeAndColor[ring.size][ring.color].push(cell.id);
    }
  }

  // 各サイズと色の組み合わせについて、3つ並んでいるかチェック
  for (const size in ringsBySizeAndColor) {
    for (const color in ringsBySizeAndColor[size as RingSize]) {
      const cellIds = ringsBySizeAndColor[size as RingSize][color as PlayerColor];
      
      if (cellIds && cellIds.length === 3) {
        const winner = players.find((p) => p.color === color);
        if (winner) {
          return {
            winner,
            winningCells: cellIds,
          };
        }
      }
    }
  }

  return { winner: null, winningCells: null };
};

// 利用可能なプレイヤーの色を取得する
export const getAvailableColors = (usedColors: PlayerColor[]): PlayerColor[] => {
  return PLAYER_COLORS.filter((color) => !usedColors.includes(color));
};