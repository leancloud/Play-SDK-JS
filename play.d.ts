import RoomOptions from './src/RoomOptions';

declare namespace LeanCloudPlay {
  export enum Region {
    /** 华北节点 */
    NORTH_CN,
    /** 华东节点 */
    EAST_CN,
    /** 美国节点 */
    US,
  }

  export enum Event {
    /** 连接成功 */
    CONNECTED,
    /** 连接失败 */
    CONNECT_FAILED,
    /** 断开连接 */
    DISCONNECTED,
    /** 加入到大厅 */
    JOINED_LOBBY,
    /** 离开大厅 */
    LEFT_LOBBY,
    /** 大厅房间列表变化 */
    LOBBY_ROOM_LIST_UPDATE,
    /** 创建房间成功 */
    CREATED_ROOM,
    /** 创建房间失败 */
    CREATE_ROOM_FAILED,
    /** 加入房间成功 */
    JOINED_ROOM,
    /** 加入房间失败 */
    JOIN_ROOM_FAILED,
    /** 有新玩家加入房间 */
    NEW_PLAYER_JOINED_ROOM,
    /** 有玩家离开房间 */
    PLAYER_LEFT_ROOM,
    /** 玩家活跃属性变化 */
    PLAYER_ACTIVITY_CHANGED,
    /** 主机变更 */
    MASTER_SWITCHED,
    /** 离开房间 */
    LEFT_ROOM,
    /** 房间自定义属性变化 */
    ROOM_CUSTOM_PROPERTIES_CHANGED,
    /** 玩家自定义属性变化 */
    PLAYER_CUSTOM_PROPERTIES_CHANGED,
    /** 自定义事件 */
    CUSTOM_EVENT,
    /** 错误事件 */
    ERROR,
  }

  export enum ReceiverGroup {
    /** 其他人（除了自己之外的所有人） */
    Others,
    /** 所有人（包括自己） */
    All,
    /** 主机客户端 */
    MasterClient,
  }

  export class SendEventOptions {
    receiverGroup: ReceiverGroup;
    targetActorIds: string[];
  }

  export class LobbyRoom {
    readonly roomName: string;
    readonly maxPlayerCount: number;
    readonly expectedUserIds: string[];
    readonly emptyRoomTtl: number;
    readonly playerTtl: number;
    readonly playerCount: number;
    readonly customRoomPropertiesForLobby: Object;
  }

  export class Player {
    readonly userId: string;
    readonly actorId: number;
    isLocal(): boolean;
    isMaster(): boolean;
    isInActive(): boolean;
    setCustomProperties(
      properties: Object,
      opts?: {
        expectedValues?: Object;
      }
    ): void;
    getCustomProperties(): Object;
  }

  export class Room {
    readonly name: string;
    readonly opened: boolean;
    readonly visible: boolean;
    readonly maxPlayerCount: number;
    readonly masterId: number;
    readonly expectedUserIds: string[];
    getPlayer(actorId: number): Player;
    playerList(): Player[];
    setCustomProperties(
      properties: Object,
      opts?: {
        expectedValues?: Object;
      }
    ): void;
    getCustomProperties(): Object;
  }

  export class RoomOptions {
    opened: boolean;
    visible: boolean;
    emptyRoomTtl: number;
    playerTtl: number;
    maxPlayerCount: number;
    customRoomProperties: Object;
    customRoomPropertiesKeysForLobby: string[];
  }

  export class Play extends EventEmitter {
    init(opts: { appId: string; appKey: string; region: Region }): void;
    connect(opts: { gameVersion?: string; autoJoinLobby?: boolean }): void;
    reconnect(): void;
    reconnectAndRejoin(): void;
    disconnect(): void;
    joinLobby(): void;
    leaveLobby(): void;
    createRoom(
      roomName: string,
      opts?: {
        roomOptions?: RoomOptions;
        expectedUserIds?: string[];
      }
    ): void;
    joinRoom(
      roomName: string,
      opts?: {
        expectedUserIds?: string[];
      }
    ): void;
    rejoinRoom(roomName: string): void;
    joinOrCreateRoom(
      roomName: string,
      opts?: {
        roomOptions?: RoomOptions;
        expectedUserIds: string[];
      }
    ): void;
    joinRandomRoom(opts?: {
      matchProperties?: Object;
      expectedUserIds?: string[];
    }): void;
    setRoomOpened(opened: boolean): void;
    setRoomVisible(visible: boolean): void;
    setMaster(newMasterId: number): void;
    sendEvent(
      eventId: number | string,
      eventData: Object,
      options: SendEventOptions
    ): void;
    leaveRoom(): void;
    readonly room: Room;
    readonly player: Player;
  }
}
