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
        this.peer = new Peer('', { // Peer IDは空のまま（サーバー側で生成される）
          config: {
            'iceServers': [
              // STUNサーバー (Google Public STUN)
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' },
              // Twilio TURNサーバー (静的認証情報 - テスト・開発用)
              // 必ずご自身のTwilio認証情報に置き換えてください
              {
                urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                username: process.env.TWILIO_ACCOUNT_SID,    // Twilioから提供される認証情報
                credential: process.env.TWILIO_AUTH_TOKEN // Twilioから提供される認証情報
              },
              {
                urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
                username: process.env.TWILIO_ACCOUNT_SID,
                credential: process.env.TWILIO_AUTH_TOKEN
              },
              // 必要に応じてTLS版 (turns) も追加できます。ポートは通常443または5349です。
              // Twilioのドキュメントで確認してください。
              {
                urls: 'turns:global.turn.twilio.com:443?transport=tcp',
                username: process.env.TWILIO_ACCOUNT_SID,
                credential: process.env.TWILIO_AUTH_TOKEN
              }
            ]
          },
          debug: 2, // デバッグレベル (0: none, 1: errors, 2: warnings, 3: all)
          // secure: true, // PeerServerがWSS/HTTPSの場合に設定 (0.peerjs.com はデフォルトでこれに該当するはず)
          host: '0.peerjs.com', // デフォルトのPeerJSシグナリングサーバー
          port: 443,
          path: '/',
          pingInterval: 5000
        });
        
        this.peer.on('open', (id) => {
          this.myId = id;
          console.log('My peer ID is: ' + id);
          resolve(id);
        });
        
        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });
        
        let retryCount = 0;
        const maxRetries = 3;
        
        this.peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
            // 再初期化ではなく、エラーの種類に応じて特定のアクションを検討する方が良い場合もあります。
            // ここでは元のロジックを維持しますが、エラー内容によっては`this.peer.destroy()`後に
            // `this.initialize()`を再度呼び出すか、UIにエラーを通知するなどの処理が必要です。
            // PeerJSの接続エラーは多岐にわたるため、単純なリトライで解決しないことも多いです。
          } else {
            reject(err); // 最大リトライ回数を超えたらreject
          }
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
      console.log(`Connected to: ${conn.peer}`);
      
      conn.on('data', (data: unknown) => {
        this.handleMessage(data as Message);
      });
      
      conn.on('close', () => {
        console.log(`Connection closed with: ${conn.peer}`);
        delete this.connections[conn.peer];
        this.triggerCallback('LEAVE_ROOM', { peerId: conn.peer });
      });
      
      conn.on('error', (err: Error) => {
        console.error('Connection error with ' + conn.peer + ':', err);
      });
    });
  }

  // メッセージ処理
  private handleMessage(message: Message) {
    this.triggerCallback(message.type, message.data);
  }

  // コールバックを実行
  private triggerCallback(type: MessageType, data: unknown) {
    if (this.callbacks[type]) {
      this.callbacks[type].forEach((callback) => callback(data));
    }
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
      if (conn && conn.open) { // 接続が開いているか確認
        conn.send(message);
      } else {
        console.warn(`Connection to ${targetId} not open or does not exist.`);
      }
    } else {
      Object.values(this.connections).forEach((conn) => {
        if (conn.open) { // 接続が開いているか確認
          conn.send(message);
        }
      });
    }
  }

  // イベントリスナーを追加
  on<T>(type: MessageType, callback: (data: T) => void) {
    if (!this.callbacks[type]) {
      this.callbacks[type] = [];
    }
    this.callbacks[type].push(callback as (data: unknown) => void);
  }

  // イベントリスナーを削除
  off<T>(type: MessageType, callback: (data: T) => void) {
    if (this.callbacks[type]) {
      this.callbacks[type] = this.callbacks[type].filter((cb) => cb !== callback);
    }
  }

  // ルームを作成
  createRoom(): void { // roomIdは引数で受け取るが、実際にはPeerJSのIDをルームIDとして使うことが多い
    this.roomId = this.myId; // 通常、ホストのPeerIDをルームIDとする
    this.isHost = true;
    console.log(`Room created with ID: ${this.roomId}`);
  }

  // joinRoom メソッド
  joinRoom(roomIdToJoin: string, player: Player): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }

      this.roomId = roomIdToJoin; // 参加するルームのIDを設定
      let connectAttempts = 0;
      const maxConnectAttempts = 3;

      const attemptConnection = () => {
        if (!this.peer || this.peer.destroyed) {
          reject(new Error('Peer became unavailable during connection attempt'));
          return;
        }
        console.log(`Attempting to connect to room (peer ID): ${roomIdToJoin}`);
        const conn = this.peer.connect(roomIdToJoin, { reliable: true });

        conn.on('open', () => {
          this.setupConnection(conn);
          // 接続が確立されたらJOIN_ROOMメッセージを送信
          // メッセージ送信は sendMessage メソッド経由で行う
          this.sendMessage('JOIN_ROOM', { player }, roomIdToJoin);
          console.log(`Successfully connected to room ${roomIdToJoin} and sent JOIN_ROOM`);
          resolve();
        });

        conn.on('error', (err) => {
          console.error(`Failed to connect to room ${roomIdToJoin} (attempt ${connectAttempts + 1}):`, err);
          connectAttempts++;
          if (connectAttempts < maxConnectAttempts) {
            setTimeout(attemptConnection, 2000 * connectAttempts);
          } else {
            reject(new Error(`Failed to connect to room ${roomIdToJoin} after ${maxConnectAttempts} attempts. Last error: ${err.message}`));
          }
        });
      };
      attemptConnection();
    });
  }

  // ゲームを開始
  startGame(gameState: GameState): void {
    if (!this.isHost) return;
    
    this.sendMessage('GAME_START', { gameState });
    // ホスト自身もゲーム開始イベントを処理できるようにローカルでもトリガー
    this.triggerCallback('GAME_START', { gameState });
  }

  // ゲーム状態を更新
  updateGameState(gameState: GameState): void {
    if (!this.isHost) return;
    
    this.sendMessage('GAME_STATE', { gameState });
  }

  // リングを配置
  placeRing(cellId: string, ringSize: RingSize): void {
    // placeRingはホストだけでなく、クライアントも呼び出してホストに通知する
    this.sendMessage('PLACE_RING', { cellId, ringSize });
  }

  // プレイヤーをルームに追加（ホストのみ）
  // このメソッドはJOIN_ROOMメッセージを受け取ったホストが、他の参加者に新しいプレイヤーを通知する際に使用
  addPlayerToRoom(player: Player, targetPeerId?: string): void {
    if (!this.isHost) return;
    
    // targetPeerId が指定されていればそのピアにのみ、そうでなければ全員に送信
    this.sendMessage('PLAYER_JOINED', { player }, targetPeerId);
  }

  // 接続を閉じる
  close(): void {
    Object.values(this.connections).forEach((conn) => {
      conn.close();
    });
    
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }
    
    this.peer = null;
    this.connections = {};
    console.log('P2P connection closed and peer destroyed.');
  }

  // 自分のIDを取得
  getMyId(): string {
    return this.myId;
  }

  // 接続されているピアのIDを取得
  getConnectedPeerIds(): string[] {
    return Object.keys(this.connections);
  }

  // 現在のルームIDを取得
  getRoomId(): string {
    return this.roomId;
  }

  // ホストかどうか
  getIsHost(): boolean {
    return this.isHost;
  }
}

export const createP2PConnection = (): P2PConnection => {
  return new P2PConnection();
};