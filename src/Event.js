// 事件
var Event = {
  // 连接成功
  OnConnected: 'OnConnected',
  // 连接失败
  OnConnectFailed: 'OnConnectionFail',
  // 断开连接
  OnDisconnected: 'OnDisconnected',
  // 加入到大厅
  OnJoinedLobby: 'OnJoinedLobby',
  // 离开大厅
  OnLeftLobby: 'OnLeftLobby',
  // 大厅房间列表变化
  OnLobbyRoomListUpdate: 'OnLobbyRoomListUpdate',
  // 创建房间成功
  OnCreatedRoom: 'OnCreatedRoom',
  // 创建房间失败
  OnCreateRoomFailed: 'OnCreateRoomFailed',
  // 加入房间成功
  OnJoinedRoom: 'OnJoinedRoom',
  // 加入房间失败
  OnJoinRoomFailed: 'OnJoinRoomFailed',
  // 有新玩家加入房间
  OnNewPlayerJoinedRoom: 'OnNewPlayerJoinedRoom',
  // 有玩家离开房间
  OnPlayerLeftRoom: 'OnPlayerLeftRoom',
  // 玩家活跃属性变化
  OnPlayerActivityChanged: 'OnPlayerActivityChanged',
  // 主机变更
  OnMasterSwitched: 'OnMasterSwitched',
  // 离开房间
  OnLeftRoom: 'OnLeftRoom',
  // 房间自定义属性变化
  OnRoomCustomPropertiesChanged: 'OnRoomCustomPropertiesChanged',
  // 玩家自定义属性变化
  OnPlayerCustomPropertiesChanged: 'OnPlayerCustomPropertiesChanged',
  // 自定义事件
  OnEvent: 'OnEvent',
  // 错误事件
  OnError: 'OnError',
};

export { Event };
