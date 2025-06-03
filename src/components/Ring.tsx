import React from 'react';
import { motion } from 'framer-motion';
import { PlayerColor, RingSize } from '../types/game';

interface RingProps {
  size: RingSize;
  color: PlayerColor;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const Ring: React.FC<RingProps> = ({ size, color, isSelected, onClick, disabled }) => {
  const sizeMap = {
    small: { outer: 30, inner: 18, borderWidth: 6 },
    medium: { outer: 50, inner: 30, borderWidth: 10 },
    large: { outer: 70, inner: 42, borderWidth: 14 },
  };

  const colorMap = {
    red: { regular: 'bg-red-500', hover: 'hover:bg-red-600', selected: 'bg-red-600' },
    blue: { regular: 'bg-blue-500', hover: 'hover:bg-blue-600', selected: 'bg-blue-600' },
    green: { regular: 'bg-green-500', hover: 'hover:bg-green-600', selected: 'bg-green-600' },
    yellow: { regular: 'bg-yellow-500', hover: 'hover:bg-yellow-600', selected: 'bg-yellow-600' },
  };

  const dimensions = sizeMap[size];
  const colors = colorMap[color];

  return (
    <motion.div
      className={`relative rounded-full ${colors.regular} ${
        isSelected ? colors.selected : colors.hover
      } cursor-pointer`}
      style={{
        width: dimensions.outer,
        height: dimensions.outer,
        padding: dimensions.borderWidth,
      }}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className="absolute rounded-full bg-white"
        style={{
          top: dimensions.borderWidth,
          left: dimensions.borderWidth,
          width: dimensions.inner,
          height: dimensions.inner,
        }}
      />
    </motion.div>
  );
};

export default Ring;