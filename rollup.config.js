import nodeGlobals from 'rollup-plugin-node-globals';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs    from 'rollup-plugin-commonjs';
import buble       from 'rollup-plugin-buble';
import filesize    from 'rollup-plugin-filesize';

module.exports = {
  entry   : 'bouncycastle.js',
  dest    : './build/bouncycastle.js',
  format  : 'iife',
  plugins : [
    nodeResolve({ jsnext: true, main: true, browser: true }),
    commonjs({
      exclude : ['node_modules/pretender/node_modules/**'],
      ignoreGlobal: true
    }),
    nodeGlobals(),
    buble(),
    filesize()
  ]
};
