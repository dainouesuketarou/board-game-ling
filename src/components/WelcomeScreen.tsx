import React from 'react';
import { motion } from 'framer-motion';
import { CircleIcon } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <motion.div
      className="card max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="inline-block p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mb-4"
        >
          <CircleIcon className="text-white w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
          輪っか対戦ゲーム
        </h1>
      </div>
      
      <p className="text-gray-600 mb-10 text-center text-lg leading-relaxed">
        友達と一緒に遊べる、シンプルで楽しい輪っか配置ゲーム。
        ルームを作成するか、既存のルームに参加してゲームを始めましょう！
      </p>
      
      <div className="grid grid-cols-1 gap-4 w-full mb-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary"
          onClick={onCreateRoom}
        >
          ルームを作成
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/50 backdrop-blur-sm text-gray-800 py-3 px-6 rounded-lg hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 border border-gray-200"
          onClick={onJoinRoom}
        >
          ルームに参加
        </motion.button>
      </div>
      
      <div className="p-6 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-100/50 w-full">
        <h2 className="text-xl font-bold text-blue-800 mb-4">ゲームルール</h2>
        <ul className="list-disc pl-5 text-gray-600 space-y-1">
          <li>各プレイヤーは3サイズ、各3個ずつの輪っかを持っています</li>
          <li>3x3のボード上に順番に輪っかを配置します</li>
          <li>各マスには大・中・小の輪っかを一つずつ置けます</li>
          <li>
            勝利条件:
            <ul className="list-circle pl-5 mt-1">
              <li>同じマスに同じ色の輪っかを3つ置く</li>
              <li>同じ色の輪っかを大きい順または小さい順に縦・横・斜めに並べる</li>
              <li>同じ色・同じサイズの輪っかを縦・横・斜めに3つ並べる</li>
            </ul>
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;