import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import { GameState, Player, RingSize } from '../types/game';
import { placeRing } from '../utils/gameUtils';

interface GameContainerProps {
  gameState: GameState;
  onGameStateChange: (newState: GameState) => void;
  playerId: string;
  isHost: boolean;
  onPlaceRing: (cellId: string, ringSize: RingSize) => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameState,
  onGameStateChange,
  playerId,
  isHost,
  onPlaceRing,
}) => {
  const [selectedRingSize, setSelectedRingSize] = useState<RingSize | null>(
    gameState.selectedRingSize
  );

  // ゲーム状態が変更されたときにselectedRingSizeを更新
  useEffect(() => {
    setSelectedRingSize(gameState.selectedRingSize);
  }, [gameState.selectedRingSize]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerTurn = currentPlayer?.id === playerId;

  const handleRingSelect = (size: RingSize) => {
    if (!isCurrentPlayerTurn) return;

    const newGameState = { ...gameState, selectedRingSize: size };
    setSelectedRingSize(size);
    onGameStateChange(newGameState);
  };

  const handleCellClick = (cellId: string) => {
    if (!isCurrentPlayerTurn || !selectedRingSize) return;
    
    // ホストでない場合は、サーバーにリングの配置を送信
    if (!isHost) {
      onPlaceRing(cellId, selectedRingSize);
      return;
    }

    // ホストの場合は、ゲーム状態を更新
    const newGameState = placeRing(gameState, cellId, selectedRingSize);
    
    if (newGameState !== gameState) {
      onGameStateChange(newGameState);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 text-2xl font-bold text-gray-800">
        {gameState.winner
          ? `${gameState.winner.name}の勝利！`
          : '輪っかを配置してください'}
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
        <div className="flex-1 order-2 md:order-1">
          <div className="grid grid-cols-1 gap-2">
            {gameState.players.map((player: Player) => (
              <PlayerInfo
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayer?.id}
                onRingSelect={handleRingSelect}
                selectedRingSize={player.id === currentPlayer?.id ? selectedRingSize : null}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 order-1 md:order-2">
          <GameBoard gameState={gameState} onCellClick={handleCellClick} />
          
          {gameState.winner && (
            <motion.div
              className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="text-xl font-bold text-yellow-800">ゲーム終了！</p>
              <p className="text-lg text-yellow-800">
                {gameState.winner.name}の勝利です！
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GameContainer;