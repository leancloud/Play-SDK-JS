import { readFileSync } from 'fs';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';
import insertLine from 'insert-line';

const babelrc = JSON.parse(readFileSync('./.babelrc', 'utf8'));

babelrc.presets.splice(0, 1, ['env', { modules: false }]);
babelrc.plugins.splice(0, 0, 'external-helpers');

const BABEL_CONFIG = {
  babelrc: false,
  ...babelrc,
  runtimeHelpers: true,
  exclude: 'node_modules/**',
};

// 修改 google-protobuf
const path = './node_modules/google-protobuf/google/protobuf/wrappers_pb.js';
const insertCode = '// 适配微信小程序\nvar { proto } = global;';
const flag = 'goog.exportSymbol(';
const code = readFileSync(path, 'utf8');
if (!code.includes(insertCode)) {
  const lines = code.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith(flag)) {
      if (start < 0) {
        start = i;
      }
    } else if (start > -1) {
      end = i + 1;
      break;
    }
  }
  insertLine(path)
    .contentSync(insertCode)
    .at(end);
}

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
