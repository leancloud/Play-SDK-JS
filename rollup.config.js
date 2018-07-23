import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

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
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
    ],
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/play-node.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [commonjs(), json()],
  },
];
