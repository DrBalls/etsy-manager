import { AutonomousTestGenerator } from './autonomous-test-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

interface TestResult {
  file: string;
  passed: boolean;
  testsGenerated: number;
  testsPassed: number;
  testsFailed: number;
  errors: string[];
  selfHealed: boolean;
}

interface OrchestratorOptions {
  projectRoot: string;
  openaiApiKey: string;
  targetFiles?: string[];
  testTypes?: ('unit' | 'integration' | 'e2e')[];
  autoHeal?: boolean;
  parallelism?: number;
}

export class TestOrchestrator {
  private generator: AutonomousTestGenerator;
  private options: Required<OrchestratorOptions>;
  private results: TestResult[] = [];

  constructor(options: OrchestratorOptions) {
    this.options = {
      targetFiles: [],
      testTypes: ['unit', 'integration'],
      autoHeal: true,
      parallelism: 4,
      ...options
    };
    
    this.generator = new AutonomousTestGenerator(
      options.openaiApiKey,
      options.projectRoot
    );
  }

  async orchestrate(): Promise<{ summary: string; results: TestResult[] }> {
    console.log('🚀 Starting autonomous test orchestration...');
    
    // 1. Discover files to test
    const filesToTest = await this.discoverFiles();
    console.log(`📁 Found ${filesToTest.length} files to test`);
    
    // 2. Generate tests for each file
    const testGenerationPromises = filesToTest.map(file => 
      this.processFile(file)
    );
    
    // Process in batches for parallelism control
    const batches = this.createBatches(testGenerationPromises, this.options.parallelism);
    
    for (const batch of batches) {
      const batchResults = await Promise.all(batch);
      this.results.push(...batchResults);
    }
    
    // 3. Generate summary report
    const summary = this.generateSummary();
    
    // 4. Save results
    await this.saveResults();
    
    return { summary, results: this.results };
  }

  private async discoverFiles(): Promise<string[]> {
    if (this.options.targetFiles.length > 0) {
      return this.options.targetFiles;
    }
    
    // Auto-discover TypeScript/React files
    const patterns = [
      'apps/web/app/**/*.{ts,tsx}',
      'apps/web/components/**/*.{ts,tsx}',
      'apps/web/lib/**/*.{ts,tsx}',
      'packages/shared/src/**/*.{ts,tsx}',
      'apps/api/src/**/*.ts',
      'apps/extension/src/**/*.{ts,tsx}'
    ];
    
    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.options.projectRoot,
        ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.next/**']
      });
      files.push(...matches);
    }
    
    return files;
  }

  private async processFile(filePath: string): Promise<TestResult> {
    const result: TestResult = {
      file: filePath,
      passed: false,
      testsGenerated: 0,
      testsPassed: 0,
      testsFailed: 0,
      errors: [],
      selfHealed: false
    };
    
    try {
      console.log(`🔍 Processing ${filePath}...`);
      
      // Generate tests for each test type
      for (const testType of this.options.testTypes) {
        const framework = testType === 'e2e' ? 'playwright' : 'jest';
        
        const generatedTests = await this.generator.generateTests({
          filePath,
          testType,
          framework
        });
        
        result.testsGenerated += generatedTests.length;
        
        // Write test files
        const testFilePath = this.getTestFilePath(filePath, testType);
        await this.writeTestFile(testFilePath, generatedTests, framework);
        
        // Run the tests
        const testResult = await this.generator.runTests(testFilePath);
        
        if (testResult.passed) {
          result.testsPassed += generatedTests.length;
        } else {
          result.testsFailed += generatedTests.length;
          
          // Attempt self-healing if enabled
          if (this.options.autoHeal) {
            console.log(`🔧 Attempting to self-heal tests for ${filePath}...`);
            
            const healedTest = await this.generator.selfHealTest(
              testFilePath,
              testResult.output
            );
            
            // Write healed test and re-run
            writeFileSync(join(this.options.projectRoot, testFilePath), healedTest);
            
            const healedResult = await this.generator.runTests(testFilePath);
            if (healedResult.passed) {
              result.testsPassed = generatedTests.length;
              result.testsFailed = 0;
              result.selfHealed = true;
            }
          }
        }
      }
      
      result.passed = result.testsFailed === 0;
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    
    return result;
  }

  private getTestFilePath(sourceFile: string, testType: string): string {
    const testDir = testType === 'e2e' ? 'e2e' : '__tests__';
    const testExt = testType === 'e2e' ? '.e2e.ts' : '.test.ts';
    
    // Convert source path to test path
    const parts = sourceFile.split('/');
    const lastPart = parts[parts.length - 1];
    if (!lastPart) {
      throw new Error(`Invalid source file path: ${sourceFile}`);
    }
    const fileName = lastPart.replace(/\.(ts|tsx)$/, testExt);
    
    // Insert test directory
    parts.splice(-1, 0, testDir);
    parts[parts.length - 1] = fileName;
    
    return parts.join('/');
  }

  private async writeTestFile(
    testFilePath: string,
    tests: any[],
    framework: string
  ): Promise<void> {
    const fullPath = join(this.options.projectRoot, testFilePath);
    const dir = dirname(fullPath);
    
    // Ensure directory exists
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Build test file content
    let content = '';
    
    if (framework === 'jest') {
      content = `import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

`;
    } else {
      content = `import { test, expect } from '@playwright/test';

`;
    }
    
    // Add all tests
    for (const test of tests) {
      if (test.setup) {
        content += `beforeEach(async () => {
${test.setup}
});

`;
      }
      
      content += `test('${test.testName}', async () => {
${test.testCode}
});

`;
      
      if (test.teardown) {
        content += `afterEach(async () => {
${test.teardown}
});

`;
      }
    }
    
    writeFileSync(fullPath, content);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private generateSummary(): string {
    const totalFiles = this.results.length;
    const totalTests = this.results.reduce((sum, r) => sum + r.testsGenerated, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.testsPassed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.testsFailed, 0);
    const totalHealed = this.results.filter(r => r.selfHealed).length;
    const filesWithErrors = this.results.filter(r => r.errors.length > 0).length;
    
    return `
🎯 Autonomous Test Generation Summary
====================================

📊 Files Processed: ${totalFiles}
✅ Total Tests Generated: ${totalTests}
✅ Tests Passed: ${totalPassed}
❌ Tests Failed: ${totalFailed}
🔧 Tests Self-Healed: ${totalHealed}
⚠️  Files with Errors: ${filesWithErrors}

📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%
🔧 Self-Healing Rate: ${((totalHealed / this.results.filter(r => r.testsFailed > 0).length) * 100).toFixed(2)}%

${this.results.filter(r => !r.passed).length > 0 ? '\n❌ Failed Files:\n' + this.results.filter(r => !r.passed).map(r => `  - ${r.file}: ${r.errors.join(', ')}`).join('\n') : '✅ All tests passing!'}
`;
  }

  private async saveResults(): Promise<void> {
    const resultsPath = join(this.options.projectRoot, '.taskmaster/test-results.json');
    const resultsDir = dirname(resultsPath);
    
    if (!existsSync(resultsDir)) {
      mkdirSync(resultsDir, { recursive: true });
    }
    
    writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.results
    }, null, 2));
  }

  async runContinuousMonitoring(): Promise<void> {
    console.log('👁️  Starting continuous test monitoring...');
    
    // Watch for file changes
    const chokidar = await import('chokidar');
    
    const watcher = chokidar.watch([
      'apps/**/*.{ts,tsx}',
      'packages/**/*.{ts,tsx}'
    ], {
      cwd: this.options.projectRoot,
      ignored: ['**/node_modules/**', '**/.next/**', '**/*.test.*', '**/*.spec.*']
    });
    
    watcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      const result = await this.processFile(filePath);
      
      if (!result.passed) {
        console.log(`❌ Tests failed for ${filePath}`);
        if (result.selfHealed) {
          console.log(`✅ Tests were self-healed successfully!`);
        }
      }
    });
    
    // Set up periodic full test runs
    setInterval(async () => {
      console.log('🔄 Running periodic full test suite...');
      await this.orchestrate();
    }, 60 * 60 * 1000); // Every hour
  }
}