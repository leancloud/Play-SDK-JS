import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';

export default {
  input: 'src/index.js',
  output: {
    name: 'play',
    file: 'play.js',
    format: 'umd',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify( 'production' )
    })
  ],
};