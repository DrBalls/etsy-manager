const { build } = require('tsup');
const { rm } = require('fs/promises');
const path = require('path');

async function buildWindows() {
  console.log('Starting Windows-compatible build...');
  
  // Clean dist directory
  try {
    await rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
  } catch (e) {
    // Ignore if doesn't exist
  }

  try {
    // Build without DTS first
    await build({
      entry: {
        index: 'src/index.ts',
        types: 'src/types/index.ts',
        utils: 'src/utils/index.ts',
        api: 'src/api/index.ts',
      },
      format: ['cjs', 'esm'],
      dts: false, // Disable DTS for initial build
      splitting: false,
      sourcemap: true,
      clean: true,
      shims: true,
      target: 'es2022',
      platform: 'node',
    });

    console.log('JavaScript build completed successfully');

    // Generate types separately using tsc
    console.log('Generating type declarations...');
    const { execSync } = require('child_process');
    execSync('pnpm exec tsc --emitDeclarationOnly --declaration --declarationMap', {
      stdio: 'inherit',
      cwd: __dirname,
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildWindows();