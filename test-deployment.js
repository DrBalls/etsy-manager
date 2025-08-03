#!/usr/bin/env node

/**
 * Deployment Readiness Test
 * Verifies that the Etsy Manager application is ready for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Etsy Manager Deployment Readiness Test\n');

const tests = [];
let passed = 0;
let failed = 0;

function runTest(name, testFn) {
  console.log(`\nRunning: ${name}...`);
  try {
    testFn();
    tests.push({ name, status: 'PASSED', error: null });
    passed++;
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    tests.push({ name, status: 'FAILED', error: error.message });
    failed++;
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Check Node.js version
runTest('Node.js version check', () => {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  if (major < 18) {
    throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
  }
});

// Test 2: Check pnpm installation
runTest('pnpm installation check', () => {
  execSync('pnpm --version', { stdio: 'ignore' });
});

// Test 3: Check dependencies are installed
runTest('Dependencies installation check', () => {
  if (!fs.existsSync('node_modules')) {
    throw new Error('node_modules not found. Run "pnpm install"');
  }
});

// Test 4: Check environment files
runTest('Environment configuration check', () => {
  const requiredEnvFiles = ['.env.example'];
  for (const file of requiredEnvFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file ${file} not found`);
    }
  }
});

// Test 5: Check TypeScript compilation
runTest('TypeScript compilation check', () => {
  console.log('   Building all packages...');
  execSync('pnpm build', { stdio: 'ignore' });
});

// Test 6: Check database configuration
runTest('Database configuration check', () => {
  const prismaSchemaPath = 'apps/web/prisma/schema.prisma';
  if (!fs.existsSync(prismaSchemaPath)) {
    throw new Error('Prisma schema not found');
  }
});

// Test 7: Check critical directories
runTest('Project structure check', () => {
  const criticalDirs = [
    'apps/web',
    'apps/api',
    'apps/desktop',
    'apps/extension',
    'packages/shared',
    '.github/workflows'
  ];
  
  for (const dir of criticalDirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Critical directory ${dir} not found`);
    }
  }
});

// Test 8: Check for TypeScript errors
runTest('TypeScript type checking', () => {
  console.log('   Running type checks...');
  execSync('pnpm typecheck', { stdio: 'ignore' });
});

// Test 9: Check package.json scripts
runTest('Package scripts check', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'build', 'test', 'lint'];
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      throw new Error(`Required script "${script}" not found in package.json`);
    }
  }
});

// Test 10: Check deployment workflow
runTest('CI/CD workflow check', () => {
  const workflowPath = '.github/workflows/deploy.yml';
  if (!fs.existsSync(workflowPath)) {
    console.log('   Warning: Deploy workflow not found, but not critical');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Deployment Readiness Summary\n');
console.log(`Total Tests: ${tests.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('\nDetailed Results:');

tests.forEach(test => {
  const icon = test.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
  if (test.error) {
    console.log(`   └─ ${test.error}`);
  }
});

console.log('\n' + '='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All deployment checks passed!');
  console.log('✨ The application is ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in production');
  console.log('2. Configure database connection');
  console.log('3. Deploy to your hosting platform');
  process.exit(0);
} else {
  console.log('\n⚠️  Some deployment checks failed.');
  console.log('Please fix the issues above before deploying.');
  process.exit(1);
}