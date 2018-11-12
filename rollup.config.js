import { readFileSync } from 'fs';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

const babelrc = JSON.parse(readFileSync('./.babelrc', 'utf8'));

babelrc.presets.splice(0, 1, ['env', { modules: false }]);
babelrc.plugins.splice(0, 0, 'external-helpers');

const BABEL_CONFIG = {
  babelrc: false,
  ...babelrc,
  runtimeHelpers: true,
  exclude: 'node_modules/**',
};

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'play',
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
      file: 'dist/play-node.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [json(), babel(BABEL_CONFIG), commonjs()],
  },
  {
    input: 'src/index-weapp.js',
    output: {
      name: 'play',
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
      name: 'play',
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
