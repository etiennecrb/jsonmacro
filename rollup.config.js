import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		entry: 'build/main.js',
		dest: pkg.browser,
		format: 'umd',
		moduleName: 'jsonmacro',
		plugins: [
            resolve(),
            commonjs()
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build
	{
		entry: 'build/main.js',
		external: ['pegjs'],
		targets: [
			{ dest: pkg.main, format: 'cjs' },
			{ dest: pkg.module, format: 'es' }
		]
	}
];
