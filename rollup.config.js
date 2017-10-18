import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
    {
        entry: 'build/editor/index.js',
        dest: 'dist/jsonmacro.editor.js',
        format: 'umd',
        moduleName: 'JsonMacro',
        plugins: [
            resolve(),
            commonjs()
        ]
    },
    {
        entry: 'build/compiler/index.js',
        dest: 'dist/jsonmacro.compiler.js',
        format: 'umd',
        moduleName: 'JsonMacro',
        plugins: [
            resolve(),
            commonjs()
        ]
    }
];
