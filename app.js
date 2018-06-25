import { 
    Play, 
    Room, 
    Player, 
    Event, 
    RoomOptions, 
    ReceiverGroup, 
    SendEventOptions 
} from './src/index';

// 测试用户
var Play1 = new Play();
var Play2 = new Play();

Play1.userId = "hello";
Play1.init("315XFAYyIGPbd98vHPCBnLre-9Nh9j0Va", "Y04sM6TzhMSBmCMkwfI3FpHc");
Play1.on(Event.OnConnected, function () {
    var options = new RoomOptions();
    options.customRoomProperties = {
        title: "longmenkezhan",
        gold: 111,
    };
    options.maxPlayerCount = 2;
    options.playerTtl = 600;
    var expectedUserIds = ["world"];
    Play1.joinOrCreateRoom("123", options, expectedUserIds);
});
Play1.on(Event.OnCreatedRoom, function () {
    console.log("created room: " + Play1.room.name);
    // Play2.joinRandomRoom();
    Play2.getRoomList();
    Play2.joinRoom("123");
});
Play1.on(Event.OnNewPlayerJoinedRoom, function (newPlayer) {
    console.log("new player: " + newPlayer.userId);
    Play1.setRoomVisible(false);
    var props = {
        name: "draw",
        gold: 1000,
    };
    Play1.room.setCustomProperties(props);

    var props = {
        name: "draw22",
    };
    Play1.room.setCustomProperties(props);
    Play1.sendEvent("hello", {
        id: 123,
        name: "456"
    });
});
Play1.on(Event.OnRoomCustomPropertiesChanged, function (changedProperties) {
    var props = Play1.room.getProperties();
    console.log("Play1 room properties changed");
    for (var p in props) {
        console.log(p + " : " + props[p]);
    }
});
Play1.on(Event.OnPlayerActivityChanged, function (player) {
    console.log("player's inactivity is " + player.IsInActive());
});
// Play1.on(Event.OnPlayerLeftRoom, function (leftPlayer) {
//     console.log(leftPlayer.userId + " left room");
// });
Play1.on(Event.OnEvent, function (eventId, param, senderId) {
    console.warn("Play: " + eventId + ", " + param + ", " + senderId);
});
Play1.connect();


Play2.userId = "world";
Play2.init("315XFAYyIGPbd98vHPCBnLre-9Nh9j0Va", "Y04sM6TzhMSBmCMkwfI3FpHc");
Play2.on(Event.OnConnected, function () {
    
});
Play2.on(Event.OnCreatedRoom, function () {
    console.log("created room: " + Play2.room.name);
});
Play2.on(Event.OnJoinedRoom, function () {
    console.log("joined room: " + Play2.room.name);
})
Play2.on(Event.OnLeftRoom, function (leftPlayer) {
    console.log("left room: " + leftPlayer.userId);
});
Play2.on(Event.OnJoinRoomFailed, function (reason) {
    console.log("join room failed: " + reason);
});
Play2.on(Event.OnRoomCustomPropertiesChanged, function (changedProperties) {
    var props = Play2.room.getProperties();
    console.log("Play2 room properties changed ");
    for (var p in props) {
        console.log(p + " : " + props[p]);
    }
});
Play2.on(Event.OnEvent, function (eventId, param, senderId) {
    console.warn("Play2: " + eventId + ", " + param + ", " + senderId);
    Play2.disconnect();
});
Play2.on(Event.OnDisconnected, function () {
    console.log("Play2 ondisconnected");
});
Play2.connect();

// setTimeout(function () {
//     console.error("rejoin");
//     Play2.reconnectAndRejoin();
// }, 5000);