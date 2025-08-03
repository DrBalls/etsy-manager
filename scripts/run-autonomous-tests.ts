#!/usr/bin/env tsx

import { TestOrchestrator } from '../apps/web/lib/testing/test-orchestrator';
import { config } from 'dotenv';
import { join } from 'path';
import { program } from 'commander';

// Load environment variables
config({ path: join(__dirname, '..', '.env') });

program
  .name('autonomous-test')
  .description('Run autonomous test generation and execution')
  .option('-f, --files <files...>', 'Specific files to test')
  .option('-t, --types <types...>', 'Test types to generate (unit, integration, e2e)', ['unit', 'integration'])
  .option('--no-heal', 'Disable self-healing')
  .option('-m, --monitor', 'Enable continuous monitoring')
  .option('-p, --parallel <number>', 'Number of parallel processes', '4')
  .action(async (options) => {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      process.exit(1);
    }
    
    const orchestrator = new TestOrchestrator({
      projectRoot: join(__dirname, '..'),
      openaiApiKey,
      targetFiles: options.files,
      testTypes: options.types as ('unit' | 'integration' | 'e2e')[],
      autoHeal: options.heal,
      parallelism: parseInt(options.parallel)
    });
    
    if (options.monitor) {
      // Run continuous monitoring
      await orchestrator.runContinuousMonitoring();
    } else {
      // Run one-time test generation
      const { summary, results } = await orchestrator.orchestrate();
      console.log(summary);
      
      // Exit with error if any tests failed
      const hasFailures = results.some(r => !r.passed);
      process.exit(hasFailures ? 1 : 0);
    }
  });

program.parse();

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});