#!/bin/sh
mkdir play
cp ./dist/play.js ./dist/play.min.js ./play.d.ts ./play
zip -r play-egret.zip play
rm -r play