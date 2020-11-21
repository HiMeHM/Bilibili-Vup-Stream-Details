import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'src/index.js',
    output: {
      dir: './dist',
      format: 'es'
      /* firefox extension not support chunk splitting :(
      manualChunks(id) {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
      }
      */
    },
    watch: {
        include: 'src/**',
    },
    plugins: [
        commonjs(),
        resolve(),
        copy({
            targets: [
                { src: 'src/manifest.json', dest: 'dist'},
                { src: 'src/icons/*', dest: 'dist/icons'}
            ]
        }),
        //terser()
      ]
  };