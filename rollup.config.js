import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default [
  {
    input: 'build/editor/index.js',
    name: 'JsonMacro',
    plugins: [
      resolve(),
      commonjs(),
      sourcemaps()
    ],
    output: {
      file: 'dist/jsonmacro.editor.js',
      format: 'umd',
      sourcemap: true
    }
  },
  {
    input: 'build/compiler/index.js',
    name: 'JsonMacro',
    plugins: [
      resolve(),
      commonjs(),
      sourcemaps()
    ],
    output: {
      file: 'dist/jsonmacro.compiler.js',
      format: 'umd',
      sourcemap: true
    }
  },
  {
    input: 'build/interpreter/index.js',
    name: 'JsonMacro',
    plugins: [
      resolve(),
      commonjs(),
      sourcemaps()
    ],
    output: {
      file: 'dist/jsonmacro.interpreter.js',
      format: 'umd',
      sourcemap: true
    }
  }
];
