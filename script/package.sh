#!/bin/sh
mkdir play
cp ./dist/play.js ./dist/play.min.js ./play.d.ts ./play
zip -r play-egret.zip play
rm -r play

mkdir release
cp play-egret.zip ./release
cp ./dist/play-laya.js ./release
cp ./dist/play-weapp.js ./release
cp ./dist/play.js ./release
cp play.d.ts ./release