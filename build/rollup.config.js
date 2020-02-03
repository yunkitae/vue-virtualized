import vue from 'rollup-plugin-vue';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import typescript from 'rollup-plugin-typescript';

const config = {
  input: 'src/index.js',
  output: {
    file: 'dist/vue-list-virtualized.js',
    name: 'VueVirtualized',
    format: 'es',
    globals: {
      'interval-tree-1d': 'createIntervalTree'
    }
  },
  external: ['vue'],
  plugins: [
    typescript({
      tsconfig: false,
      experimentalDecorators: true,
      module: 'es2015'
    }),
    babel(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    vue({
      css: true,
      compileTemplate: true,
      template: {
        isProduction: true
      }
    }),
    nodeResolve()
  ]
};
export default config;
