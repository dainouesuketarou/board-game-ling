import Peer, { DataConnection } from 'peerjs';
import { GameState, Player, RingSize } from '../types/game';

type MessageType = 'JOIN_ROOM' | 'PLAYER_JOINED' | 'GAME_START' | 'GAME_STATE' | 'PLACE_RING' | 'LEAVE_ROOM';

interface Message {
  type: MessageType;
  data: unknown;
  senderId: string;
}

export class P2PConnection {
  private peer: Peer | null = null;
  private connections: Record<string, DataConnection> = {};
  private callbacks: Record<MessageType, ((data: unknown) => void)[]> = {
    JOIN_ROOM: [],
    PLAYER_JOINED: [],
    GAME_START: [],
    GAME_STATE: [],
    PLACE_RING: [],
    LEAVE_ROOM: [],
  };
  
  private myId: string = '';
  private roomId: string = '';
  private isHost: boolean = false;

  constructor() {
    // コールバックを初期化
    Object.keys(this.callbacks).forEach((key) => {
      this.callbacks[key as MessageType] = [];
    });
  }

  // P2P接続を初期化
  initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer('', {
          config: {
            'iceServers': [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              { urls: 'stun:stun.ekiga.net' },
              { urls: 'stun:stun.ideasip.com' },
              { urls: 'stun:stun.schlund.de' },
              { urls: 'stun:stun.stunprotocol.org:3478' },
              { urls: 'stun:stun.voiparound.com' },
              { urls: 'stun:stun.voipbuster.com' },
              { urls: 'stun:stun.voipstunt.com' },
              { urls: 'stun:stun.voxgratia.org' }
            ]
          },
          debug: 2, // デバッグレベルを2に下げる
          secure: true // セキュア接続を強制
        });
        
        this.peer.on('open', (id) => {
          this.myId = id;
          resolve(id);
        });
        
        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });
        
        this.peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          reject(err);
        });
      } catch (err) {
        console.error('Failed to initialize peer:', err);
        reject(err);
      }
    });
  }

  // 接続のセットアップ
  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections[conn.peer] = conn;
      
      conn.on('data', (data: unknown) => {
        this.handleMessage(data as Message);
      });
      
      conn.on('close', () => {
        delete this.connections[conn.peer];
        this.triggerCallback('LEAVE_ROOM', { peerId: conn.peer });
      });
      
      conn.on('error', (err: Error) => {
        console.error('Connection error:', err);
      });
    });
  }

  // メッセージ処理
  private handleMessage(message: Message) {
    this.triggerCallback(message.type, message.data);
  }

  // コールバックを実行
  private triggerCallback(type: MessageType, data: unknown) {
    this.callbacks[type].forEach((callback) => callback(data));
  }

  // メッセージを送信
  private sendMessage(type: MessageType, data: unknown, targetId?: string) {
    const message: Message = {
      type,
      data,
      senderId: this.myId,
    };
    
    if (targetId) {
      const conn = this.connections[targetId];
      if (conn) {
        conn.send(message);
      }
    } else {
      // すべての接続に送信
      Object.values(this.connections).forEach((conn) => {
        conn.send(message);
      });
    }
  }

  // イベントリスナーを追加
  on<T>(type: MessageType, callback: (data: T) => void) {
    this.callbacks[type].push(callback as (data: unknown) => void);
  }

  // イベントリスナーを削除
  off<T>(type: MessageType, callback: (data: T) => void) {
    this.callbacks[type] = this.callbacks[type].filter((cb) => cb !== callback);
  }

  // ルームを作成
  createRoom(roomId: string): void {
    this.roomId = roomId;
    this.isHost = true;
  }

  // ルームに参加
  joinRoom(roomId: string, player: Player): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }
      
      this.roomId = roomId;
      
      // ホストに直接接続
      const conn = this.peer.connect(roomId);
      
      conn.on('open', () => {
        this.setupConnection(conn);
        this.sendMessage('JOIN_ROOM', { player }, roomId);
        resolve();
      });
      
      conn.on('error', (err) => {
        console.error('Failed to join room:', err);
        reject(err);
      });
    });
  }

  // ゲームを開始
  startGame(gameState: GameState): void {
    if (!this.isHost) return;
    
    this.sendMessage('GAME_START', { gameState });
    this.triggerCallback('GAME_START', { gameState });
  }

  // ゲーム状態を更新
  updateGameState(gameState: GameState): void {
    if (!this.isHost) return;
    
    this.sendMessage('GAME_STATE', { gameState });
  }

  // リングを配置
  placeRing(cellId: string, ringSize: RingSize): void {
    this.sendMessage('PLACE_RING', { cellId, ringSize });
  }

  // プレイヤーをルームに追加（ホストのみ）
  addPlayerToRoom(player: Player): void {
    if (!this.isHost) return;
    
    this.sendMessage('PLAYER_JOINED', { player });
  }

  // 接続を閉じる
  close(): void {
    Object.values(this.connections).forEach((conn) => {
      conn.close();
    });
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.connections = {};
  }

  // ホストIDを取得
  getMyId(): string {
    return this.myId;
  }

  // 接続されているピアのIDを取得
  getConnectedPeerIds(): string[] {
    return Object.keys(this.connections);
  }
}

export const createP2PConnection = (): P2PConnection => {
  return new P2PConnection();
};