import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'parsers',
      sourcemap: true,
    },
    plugins: [
      babel({
        exclude: ['node_modules/**'],
      }),
      resolve(),
      commonjs(),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // the `targets` option which can specify `dest` and `format`)
  {
    input: 'src/index.js',
    output: [
      {
        file: pkg.main, format: 'cjs', name: 'parsers', sourcemap: true,
      },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
    plugins: [
      babel({
        exclude: ['node_modules/**'],
      }),
      resolve(),
      commonjs(),
    ],
  },
];
