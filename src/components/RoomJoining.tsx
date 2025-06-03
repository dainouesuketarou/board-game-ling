import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { PlayerColor } from '../types/game';

interface RoomJoiningProps {
  onRoomJoined: (roomId: string, playerName: string, color: PlayerColor) => void;
  availableColors: PlayerColor[];
  onBack: () => void;
}

const RoomJoining: React.FC<RoomJoiningProps> = ({ onRoomJoined, availableColors, onBack }) => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert('ルームIDを入力してください');
      return;
    }
    
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    if (availableColors.length === 0) {
      alert('色を選択してください');
      return;
    }
    
    onRoomJoined(roomId, playerName, availableColors[Math.floor(Math.random() * availableColors.length)]);
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
        ルーム参加
      </h2>
      
      <div className="mb-4">
        <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
          ルームID
        </label>
        <input
          id="roomId"
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="input-field font-mono"
          placeholder="6桁のルームIDを入力"
          maxLength={6}
        />
      </div>
      
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
        onClick={handleJoinRoom}
        disabled={availableColors.length === 0}
        className={`btn-primary ${
          availableColors.length === 0
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        ルームに参加
      </button>
    </motion.div>
  );
};

export default RoomJoining;