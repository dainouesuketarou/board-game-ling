import React from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle } from 'lucide-react';
import { Player } from '../types/game';

interface RoomLobbyProps {
  roomId: string;
  players: Player[];
  isHost: boolean;
  onStartGame: () => void;
  canStartGame: boolean;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  roomId,
  players,
  isHost,
  onStartGame,
  canStartGame,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorMap = {
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  };

  return (
    <motion.div
      className="card max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 mb-8 text-center">
        ルームロビー
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">ルームID:</label>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-mono font-bold bg-blue-50 px-3 py-1 rounded-lg">{roomId}</span>
            <button
              onClick={copyRoomId}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              title="IDをコピー"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          このIDを友達に共有して、ゲームに招待しましょう！
        </p>
        
        <div className="bg-blue-50/50 backdrop-blur-sm p-6 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-4">参加プレイヤー ({players.length}/4)</h3>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className={`p-3 rounded-lg ${colorMap[player.color].bg} ${colorMap[player.color].border} border shadow-sm transition-all duration-200 hover:scale-[1.02]`}
              >
                <span className={`font-medium ${colorMap[player.color].text}`}>
                  {player.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {isHost ? (
        <button
          type="button"
          onClick={onStartGame}
          disabled={!canStartGame}
          className={`btn-primary ${
            canStartGame
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {canStartGame
            ? 'ゲームを開始'
            : 'ゲームを開始するには最低2名必要です'}
        </button>
      ) : (
        <div className="text-center text-gray-600 animate-pulse">
          ホストがゲームを開始するのを待っています...
        </div>
      )}
    </motion.div>
  );
};

export default RoomLobby;