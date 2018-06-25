'use strict';

class MasterRoom {
    constructor(masterRoomDTO) {
        this.roomName = masterRoomDTO.cid;
        this.addr = masterRoomDTO.addr;
        this.secureAddr = masterRoomDTO.secureAddr;
        // 这些属性有必要提供吗？
        var roomDTO = masterRoomDTO.room;
        
    }
}

export { MasterRoom }