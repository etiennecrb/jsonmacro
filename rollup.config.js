import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		entry: 'build/index.js',
		dest: pkg.browser,
		format: 'umd',
		moduleName: 'JsonMacro',
		plugins: [
            resolve(),
            commonjs()
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build
	{
		entry: 'build/index.js',
		external: [
			'codemirror',
			'codemirror/addon/mode/simple',
			'codemirror/mode/javascript/javascript',
			'pegjs'
		],
		targets: [
			{ dest: pkg.main, format: 'cjs' },
			{ dest: pkg.module, format: 'es' }
		]
	}
];
