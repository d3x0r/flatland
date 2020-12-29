const resolve = require('@rollup/plugin-node-resolve')
//const commonjs = require('@rollup/plugin-commonjs')
//const terser = require('rollup-plugin-terser').terser
//const pkg = require('./package.json')
const acorn = require("acorn")
//const Parser = acorn.Parser
//const closure = require('rollup-plugin-closure-compiler');
//console.log( "??", closure() );
const acornPrivateMethods = require( 'acorn-private-methods');
const acornPrivateFields = require('acorn-private-class-elements')

module.exports = [
    // ES6 Modules Non-minified
    {
        input: 'flatland.js',
        output: {
            file: 'build.js',
            format: 'esm',
        },
			acorn:{
				ecmaVersion:8
			},
        acornInjectPlugins: [
				acornPrivateMethods,
            acornPrivateFields
        ],
        plugins: [
            resolve.nodeResolve(),
        ],
    },
    // ES6 Modules Minified
	/*
    {
        input: 'lib/index.js',
        output: {
            file: pkg.browser.replace(/\.js$/, '.min.mjs'),
            format: 'esm',
        },
        plugins: [
            resolve.nodeResolve(),
            commonjs(),
            terser(),
        ],
    },
	*/
]
