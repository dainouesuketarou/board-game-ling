import React from 'react';
import { motion } from 'framer-motion';
import Ring from './Ring';
import { Player, RingSize } from '../types/game';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  onRingSelect: (size: RingSize) => void;
  selectedRingSize: RingSize | null;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  isCurrentPlayer,
  onRingSelect,
  selectedRingSize,
}) => {
  const colorMap = {
    red: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' },
    green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' },
  };

  const colors = colorMap[player.color];
  const ringSizes: RingSize[] = ['small', 'medium', 'large'];

  return (
    <motion.div
      className={`flex flex-col items-center p-3 mb-2 rounded-lg border-2 ${
        isCurrentPlayer ? `${colors.border} ${colors.bg}` : 'border-gray-200'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`text-lg font-bold mb-2 ${isCurrentPlayer ? colors.text : 'text-gray-600'}`}>
        {player.name}
        {isCurrentPlayer && <span className="ml-2">（プレイ中）</span>}
      </div>

      <div className="flex space-x-4 mt-2">
        {ringSizes.map((size) => (
          <div key={size} className="flex flex-col items-center">
            <div className="flex justify-center mb-1">
              <span className={isCurrentPlayer ? colors.text : 'text-gray-600'}>
                {player.rings[size]}個
              </span>
            </div>
            <div
              className={`relative ${
                player.rings[size] === 0 || !isCurrentPlayer ? 'opacity-50' : ''
              }`}
            >
              <Ring
                size={size}
                color={player.color}
                isSelected={isCurrentPlayer && selectedRingSize === size}
                onClick={() => isCurrentPlayer && player.rings[size] > 0 && onRingSelect(size)}
                disabled={player.rings[size] === 0 || !isCurrentPlayer}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PlayerInfo;