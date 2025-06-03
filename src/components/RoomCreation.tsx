import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PlayerColor, Room } from '../types/game';
import { generateRoomId } from '../utils/gameUtils';

interface RoomCreationProps {
  onRoomCreated: (roomId: string, playerName: string, color: PlayerColor) => void;
  onBack: () => void;
}

const RoomCreation: React.FC<RoomCreationProps> = ({ onRoomCreated, onBack }) => {
  const [playerName, setPlayerName] = useState('');
  
  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    const roomId = generateRoomId();
    const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onRoomCreated(roomId, playerName, randomColor);
  };
  
  return (
    <motion.div
      className="card max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        戻る
      </button>

      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 mb-8 text-center">
        ルーム作成
      </h2>
      
      <div className="mb-4">
        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
          プレイヤー名
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input-field"
          placeholder="あなたの名前を入力"
        />
      </div>
      
      <button
        type="button"
        onClick={handleCreateRoom}
        className="btn-primary"
      >
        ルームを作成
      </button>
    </motion.div>
  );
};

export default RoomCreation;