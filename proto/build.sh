#!/bin/sh
protoc --js_out=import_style=commonjs_strict,binary:../src/proto/ ./*.proto