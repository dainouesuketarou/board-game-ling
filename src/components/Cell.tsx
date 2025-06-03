import React from 'react';
import { motion } from 'framer-motion';
import Ring from './Ring';
import { Cell as CellType, Ring as RingType } from '../types/game';

interface CellProps {
  cell: CellType;
  onClick: () => void;
  isWinningCell: boolean;
}

const Cell: React.FC<CellProps> = ({ cell, onClick, isWinningCell }) => {
  // リングを大きいものから順に並べる
  const sortedRings = [...cell.rings].sort((a, b) => {
    const sizeOrder = { large: 0, medium: 1, small: 2 };
    return sizeOrder[a.size] - sizeOrder[b.size];
  });

  return (
    <motion.div
      className={`relative flex items-center justify-center border-2 ${
        isWinningCell ? 'border-yellow-400 bg-yellow-100' : 'border-gray-300'
      } rounded-md w-24 h-24 cursor-pointer`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        {sortedRings.map((ring: RingType) => (
          <div key={ring.id} className="absolute">
            <Ring size={ring.size} color={ring.color} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Cell;