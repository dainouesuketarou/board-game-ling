import React from 'react';
import Cell from './Cell';
import { GameState } from '../types/game';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (cellId: string) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick }) => {
  const { board, winningCells } = gameState;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="grid grid-cols-3 gap-2">
        {board.map((row) =>
          row.map((cell) => (
            <Cell
              key={cell.id}
              cell={cell}
              onClick={() => onCellClick(cell.id)}
              isWinningCell={winningCells?.includes(cell.id) || false}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;