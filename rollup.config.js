import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'esm',
      },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
    ],
    plugins: [
      typescript({
        // eslint-disable-next-line global-require
        typescript: require('typescript'),
      }),
      terser({
        mangle: false,
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      name: 'curve-interpolator',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve(),
      typescript({
        // eslint-disable-next-line global-require
        typescript: require('typescript'),
      }),
      terser({
        mangle: false,
      }),
    ],
  },
];
