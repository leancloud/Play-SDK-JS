'use strict';

import { PlayObject } from './PlayObject';

class Player {
    constructor(play) {
        this.play = play;
        this.userId = '';
        this.actorId = -1;
    }

    static newFromJSONObject(play, playerJSONObject) {
        var player = new Player(play);
        player.initWithJSONObject(playerJSONObject);
        return player;
    }

    initWithJSONObject(playerJSONObject) {
        this.userId = playerJSONObject.pid;
        this.actorId = playerJSONObject.actorId;
        if (playerJSONObject.properties) {
            this.properties = PlayObject.newFromJSONObject(playerJSONObject.properties);
        } else {
            this.properties = new PlayObject();
        }
    }

    // 判断是不是当前客户端玩家
    isLocal() {
        return (this.actorId !== -1) && (this.play.player.actorId === this.actorId);
    }

    // 判断是不是主机玩家
    isMaster() {
        return (this.actorId !== -1) && (this.play.room.masterActorId === this.actorId);
    }

    // 判断是不是活跃状态
    isInActive() {
        return this.inActive;
    }

    // 设置活跃状态
    setActive(active) {
        this.inActive = !active;
    }

    // 设置自定义属性接口
    setCustomProperties(properties, expectedValues = null) {
        this.play.setPlayerCustomProperties(this.actorId, properties, expectedValues);
    }

    getCustomProperties() {
        return this.properties;
    }

    mergeProperties(changedProperties) {
        var changedPropsObj = PlayObject.newFromJSONObject(changedProperties);
        this.properties.merge(changedPropsObj);
    }
}

export { Player }