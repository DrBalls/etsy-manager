import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    types: 'src/types/index.ts',
    utils: 'src/utils/index.ts',
    api: 'src/api/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    // Workaround for Windows DTS build issues
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  // Disable parallel builds on Windows
  target: 'es2022',
  platform: 'node',
});
