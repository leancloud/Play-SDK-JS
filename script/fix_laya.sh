file=./dist/play-laya.js
sysOS=`uname -s`
if [ $sysOS == "Darwin" ];then
	sed -i '' '1 i\ 
    ;(function(exports) {' $file
    sed -i '' '$i\
    })();' $file
elif [ $sysOS == "Linux" ];then
	sed -i '1i\ 
    ;(function(exports) {' $file
    sed -i '$i\
    })();' $file
fi