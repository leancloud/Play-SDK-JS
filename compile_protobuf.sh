#!bin/sh

protoc --js_out=import_style=commonjs_strict,binary:./src/ ./proto/*.proto

for file in ./src/proto/*.js
do
    echo $file
    sed -i '' '1i\
    /* eslint-disable */
    ' $file
done