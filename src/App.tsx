import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import RoomCreation from './components/RoomCreation';
import RoomJoining from './components/RoomJoining';
import RoomLobby from './components/RoomLobby';
import GameContainer from './components/GameContainer';
import { GameState, Player, PlayerColor, RingSize } from './types/game';
import { createPlayer, createInitialGameState, getAvailableColors } from './utils/gameUtils';
import { P2PConnection, createP2PConnection } from './utils/p2pConnection';

function App() {
  // アプリケーションの状態
  const [screen, setScreen] = useState<
    'welcome' | 'create-room' | 'join-room' | 'lobby' | 'game'
  >('welcome');
  
  // ゲーム関連の状態
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [p2pConnection, setP2PConnection] = useState<P2PConnection | null>(null);

  // P2P接続を初期化
  useEffect(() => {
    const initConnection = async () => {
      const connection = createP2PConnection();
      await connection.initialize();
      setP2PConnection(connection);
      
      // イベントリスナーを設定
      connection.on('JOIN_ROOM', handlePlayerJoined);
      connection.on('PLAYER_JOINED', handlePlayerAdded);
      connection.on('GAME_START', handleGameStart);
      connection.on('GAME_STATE', handleGameStateUpdate);
      connection.on('PLACE_RING', handleRingPlacement);
      connection.on('LEAVE_ROOM', handlePlayerLeft);
    };
    
    initConnection();
    
    return () => {
      if (p2pConnection) {
        p2pConnection.close();
      }
    };
  }, []);

  // プレイヤーが参加した時のハンドラー（ホスト側）
  const handlePlayerJoined = (data: { player: Player }) => {
    if (!isHost) return;
    
    const { player } = data;
    const updatedPlayers = [...players, player];
    
    setPlayers(updatedPlayers);
    
    // 参加したプレイヤーにルーム情報を送信
    if (p2pConnection) {
      p2pConnection.addPlayerToRoom(player);
    }
  };

  // 新しいプレイヤーがルームに追加された時のハンドラー（ゲスト側）
  const handlePlayerAdded = (data: { player: Player }) => {
    if (isHost) return;
    
    const { player } = data;
    setPlayers((prevPlayers) => {
      if (prevPlayers.some((p) => p.id === player.id)) {
        return prevPlayers;
      }
      return [...prevPlayers, player];
    });
  };

  // ゲームが開始された時のハンドラー
  const handleGameStart = (data: { gameState: GameState }) => {
    const { gameState } = data;
    setGameState(gameState);
    setScreen('game');
  };

  // ゲーム状態が更新された時のハンドラー
  const handleGameStateUpdate = (data: { gameState: GameState }) => {
    const { gameState } = data;
    setGameState(gameState);
  };

  // リングが配置された時のハンドラー（ホスト側）
  const handleRingPlacement = (data: { cellId: string; ringSize: RingSize }) => {
    if (!isHost || !gameState) return;
    
    const { ringSize } = data;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 現在のプレイヤーのターンか確認
    if (currentPlayer && gameState.selectedRingSize === ringSize) {
      // ゲーム状態を更新
      const newGameState = { ...gameState };
      newGameState.selectedRingSize = ringSize;
      
      handleGameStateChange(newGameState);
    }
  };

  // プレイヤーが退出した時のハンドラー
  const handlePlayerLeft = (data: { peerId: string }) => {
    // 実装は簡略化。実際にはプレイヤーIDとピアIDのマッピングが必要
    console.log('Player left', data);
  };

  // ルーム作成画面に移動
  const handleCreateRoomClick = () => {
    setScreen('create-room');
  };

  const handleBackToWelcome = () => {
    setScreen('welcome');
  };

  // ルーム参加画面に移動
  const handleJoinRoomClick = () => {
    setScreen('join-room');
  };

  // ルーム作成時の処理
  const handleRoomCreated = (roomId: string, playerName: string, color: PlayerColor) => {
    const newPlayer = createPlayer(playerName, color);
    const peerId = p2pConnection?.getMyId() || '';
    
    setRoomId(roomId);
    setMyPlayerId(newPlayer.id);
    setPlayers([newPlayer]);
    setIsHost(true);
    
    if (p2pConnection) {
      p2pConnection.createRoom(peerId);
    }
    
    setScreen('lobby');
  };

  // ルーム参加時の処理
  const handleRoomJoined = async (roomId: string, playerName: string, color: PlayerColor) => {
    try {
      if (!p2pConnection) {
        throw new Error('P2P connection not initialized');
      }
      
      const newPlayer = createPlayer(playerName, color);
      setRoomId(roomId);
      setMyPlayerId(newPlayer.id);
      
      // ホストに接続
      await p2pConnection.joinRoom(roomId, newPlayer);
      
      setPlayers([newPlayer]); // 初期化。実際のプレイヤーリストはホストから送信されます
      setScreen('lobby');
    } catch (error) {
      console.error('Failed to join room:', error);
      // エラーの種類によってメッセージを変えるなどの処理も考えられます
      let message = 'ルームへの参加に失敗しました。';
      if (error instanceof Error) {
        // PeerJSのエラーメッセージには、接続できなかった理由に関するヒントが含まれている場合があります
        // 例えば、'peer-unavailable' や 'connection-error' など
        message += `\n理由: ${error.message}`;
      }
      alert(message + '\nルームIDを確認し、ホストがオンラインであることを確認してください。');
    }
  };

  // ゲーム開始時の処理
  const handleStartGame = () => {
    if (!isHost || players.length < 2) return;
    
    const initialGameState = createInitialGameState(players);
    setGameState(initialGameState);
    
    if (p2pConnection) {
      p2pConnection.startGame(initialGameState);
    }
    
    setScreen('game');
  };

  // ゲーム状態変更時の処理
  const handleGameStateChange = (newGameState: GameState) => {
    setGameState(newGameState);
    
    if (isHost && p2pConnection) {
      p2pConnection.updateGameState(newGameState);
    }
  };

  // リング配置時の処理
  const handlePlaceRing = (cellId: string, ringSize: RingSize) => {
    if (p2pConnection) {
      p2pConnection.placeRing(cellId, ringSize);
    }
  };

  // 利用可能な色を取得
  const availableColors = getAvailableColors(players.map((p) => p.color));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>
      <motion.div
        className="w-full max-w-6xl relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {screen === 'welcome' && (
          <WelcomeScreen
            onCreateRoom={handleCreateRoomClick}
            onJoinRoom={handleJoinRoomClick}
          />
        )}
        
        {screen === 'create-room' && (
          <RoomCreation
            onRoomCreated={handleRoomCreated}
            onBack={handleBackToWelcome}
          />
        )}
        
        {screen === 'join-room' && (
          <RoomJoining
            onRoomJoined={handleRoomJoined}
            availableColors={availableColors}
            onBack={handleBackToWelcome}
          />
        )}
        
        {screen === 'lobby' && (
          <RoomLobby
            roomId={roomId}
            players={players}
            isHost={isHost}
            onStartGame={handleStartGame}
            canStartGame={isHost && players.length >= 2}
          />
        )}
        
        {screen === 'game' && gameState && (
          <GameContainer
            gameState={gameState}
            onGameStateChange={handleGameStateChange}
            playerId={myPlayerId}
            isHost={isHost}
            onPlaceRing={handlePlaceRing}
          />
        )}
      </motion.div>
    </div>
  );
}

export default App;