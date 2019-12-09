import { readFileSync } from 'fs';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';
import modify from 'rollup-plugin-modify';

const babelrc = JSON.parse(readFileSync('./.babelrc', 'utf8'));

babelrc.presets.splice(0, 1, ['env', { modules: false }]);
babelrc.plugins.splice(0, 0, 'external-helpers');

const BABEL_CONFIG = {
  babelrc: false,
  ...babelrc,
  runtimeHelpers: true,
  exclude: 'node_modules/**',
};

const GOOGLE_PROTOBUF_WRAPPER_FIND =
  "goog.exportSymbol('proto.google.protobuf.UInt64Value', null, global);";
const GOOGLE_PROTOBUF_WRAPPER_REPLACE =
  "goog.exportSymbol('proto.google.protobuf.UInt64Value', null, global);\nvar { proto } = global;";

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'Play',
      file: 'dist/play.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      json(),
      babel(BABEL_CONFIG),
      resolve({
        browser: true,
      }),
      modify({
        find: GOOGLE_PROTOBUF_WRAPPER_FIND,
        replace: GOOGLE_PROTOBUF_WRAPPER_REPLACE,
      }),
      commonjs(),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'Play',
      file: 'dist/play.min.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      json(),
      babel(BABEL_CONFIG),
      resolve({
        browser: true,
      }),
      commonjs(),
      modify({
        find: GOOGLE_PROTOBUF_WRAPPER_FIND,
        replace: GOOGLE_PROTOBUF_WRAPPER_REPLACE,
      }),
      minify({
        // Options for babel-minify.
      }),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/play-node.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [json(), babel(BABEL_CONFIG), commonjs()],
  },
  {
    input: 'src/index-weapp.js',
    output: {
      name: 'Play',
      file: 'dist/play-weapp.js',
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      json(),
      babel(BABEL_CONFIG),
      resolve({
        browser: true,
      }),
      modify({
        find: GOOGLE_PROTOBUF_WRAPPER_FIND,
        replace: GOOGLE_PROTOBUF_WRAPPER_REPLACE,
      }),
      commonjs(),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      name: 'Play',
      file: 'dist/play-laya.js',
      format: 'umd',
      sourcemap: true,
      banner: ';(function(exports) {',
      footer: '})();',
    },
    plugins: [
      json(),
      babel(BABEL_CONFIG),
      resolve({
        browser: true,
      }),
      commonjs(),
    ],
  },
];
