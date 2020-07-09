# Play-SDK-JS

![build](https://img.shields.io/travis/leancloud/Play-SDK-JS)
![version](https://img.shields.io/github/package-json/v/leancloud/Play-SDK-JS)

## 安装

从 Release 下载 play.js 并拖拽至 Cocos Creator 中作为源码引用（无需做插件配置）

## 文档

- [API 文档](https://leancloud.github.io/Play-SDK-JS/doc/)

## 编译

在工程目录下，执行

```
rollup -c
```

dist/play.js 即为生成的库文件。

## 项目的目录结构

```
.
├── dist                      // 打包产出 (dist 分支)
│   ├── play.js                 // 最终打包的 js 文件，拖拽至 Cocos Creator 中使用
├── src                       // 源码
│   ├── index.js                // 打包入口
│   ├── Play.js                // 最重要的接口类，提供操作接口和注册事件
│   ├── Room.js                // 房间类
│   ├── Player.js                // 玩家类
│   └── ...
├── test                      // 测试用例
│   ├── Connect.test.js                 // 连接测试
│   ├── Lobby.test.js                 // 大厅测试
│   ├── CreateRoom.test.js                   // 创建房间测试
│   ├── JoinRoom.test.js                   // 加入房间测试
│   ├── ChangeProperties.test.js                   // 修改房间 / 玩家属性测试
│   ├── CustomEvent.test.js                   // 发送自定义消息测试
│   └── Master.test.js                   // 主机切换测试
```
