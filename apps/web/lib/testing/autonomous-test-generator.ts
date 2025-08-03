import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestGenerationOptions {
  filePath: string;
  testType: 'unit' | 'integration' | 'e2e';
  framework: 'jest' | 'playwright';
  context?: string;
}

interface GeneratedTest {
  testName: string;
  testCode: string;
  setup?: string;
  teardown?: string;
}

export class AutonomousTestGenerator {
  private openai: OpenAI;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.openai = new OpenAI({ apiKey });
    this.projectRoot = projectRoot;
  }

  async generateTests(options: TestGenerationOptions): Promise<GeneratedTest[]> {
    const sourceCode = await this.readSourceFile(options.filePath);
    const dependencies = await this.analyzeDependencies(options.filePath);
    const existingTests = await this.findExistingTests(options.filePath);

    const prompt = this.buildTestGenerationPrompt({
      sourceCode,
      dependencies,
      existingTests,
      ...options
    });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert test engineer specializing in TypeScript, React, and Node.js. Generate comprehensive, self-healing tests that handle edge cases and potential failures gracefully.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const generatedContent = response.choices?.[0]?.message?.content || '';
    return this.parseGeneratedTests(generatedContent);
  }

  private async readSourceFile(filePath: string): Promise<string> {
    try {
      return readFileSync(join(this.projectRoot, filePath), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read source file: ${filePath}`);
    }
  }

  private async analyzeDependencies(filePath: string): Promise<string[]> {
    const sourceCode = await this.readSourceFile(filePath);
    const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    
    let match;
    while ((match = importRegex.exec(sourceCode)) !== null) {
      if (match[1]) {
        dependencies.push(match[1]);
      }
    }
    
    return dependencies;
  }

  private async findExistingTests(filePath: string): Promise<string[]> {
    const testPaths = [
      filePath.replace(/\.tsx?$/, '.test.ts'),
      filePath.replace(/\.tsx?$/, '.test.tsx'),
      filePath.replace(/\.tsx?$/, '.spec.ts'),
      filePath.replace(/\.tsx?$/, '.spec.tsx'),
      filePath.replace(/src/, '__tests__').replace(/\.tsx?$/, '.test.ts')
    ];

    const existingTests: string[] = [];
    for (const testPath of testPaths) {
      try {
        const testContent = readFileSync(join(this.projectRoot, testPath), 'utf-8');
        existingTests.push(testContent);
      } catch (error) {
        // Test file doesn't exist, continue
      }
    }

    return existingTests;
  }

  private buildTestGenerationPrompt(data: {
    sourceCode: string;
    dependencies: string[];
    existingTests: string[];
    testType: string;
    framework: string;
    context?: string;
  }): string {
    return `Generate comprehensive ${data.testType} tests for the following TypeScript/React code:

Source Code:
\`\`\`typescript
${data.sourceCode}
\`\`\`

Dependencies: ${data.dependencies.join(', ')}

Existing Tests (if any):
${data.existingTests.length > 0 ? data.existingTests.join('\n---\n') : 'None'}

Context: ${data.context || 'None provided'}

Requirements:
1. Use ${data.framework} as the testing framework
2. Generate tests that cover:
   - Happy path scenarios
   - Error handling and edge cases
   - Boundary conditions
   - Type safety
   - Async operations (if applicable)
3. Include self-healing patterns:
   - Use data-testid attributes for E2E tests
   - Implement retry logic for flaky operations
   - Use flexible selectors that adapt to UI changes
4. Mock external dependencies appropriately
5. Include setup and teardown if needed
6. Add descriptive test names and comments
7. Ensure tests are isolated and can run in parallel

Generate the tests in the following format:
---TEST_START---
TEST_NAME: <descriptive test name>
SETUP: <any setup code>
TEST_CODE:
<the actual test code>
TEARDOWN: <any teardown code>
---TEST_END---`;
  }

  private parseGeneratedTests(content: string): GeneratedTest[] {
    const tests: GeneratedTest[] = [];
    const testRegex = /---TEST_START---(.*?)---TEST_END---/gs;
    
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      const testContent = match[1];
      if (!testContent) continue;
      
      const nameMatch = testContent.match(/TEST_NAME:\s*(.+)/);
      const setupMatch = testContent.match(/SETUP:\s*([\s\S]*?)(?=TEST_CODE:|$)/);
      const codeMatch = testContent.match(/TEST_CODE:\s*([\s\S]*?)(?=TEARDOWN:|$)/);
      const teardownMatch = testContent.match(/TEARDOWN:\s*([\s\S]*?)$/);

      if (nameMatch?.[1] && codeMatch?.[1]) {
        tests.push({
          testName: nameMatch[1].trim(),
          testCode: codeMatch[1].trim(),
          setup: setupMatch?.[1]?.trim(),
          teardown: teardownMatch?.[1]?.trim()
        });
      }
    }

    return tests;
  }

  async runTests(testFilePath: string): Promise<{ passed: boolean; output: string }> {
    try {
      const { stdout, stderr } = await execAsync(
        `cd ${this.projectRoot} && npm test -- ${testFilePath}`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      
      return {
        passed: !stderr || stderr.length === 0,
        output: stdout + stderr
      };
    } catch (error: any) {
      return {
        passed: false,
        output: error.stdout + error.stderr
      };
    }
  }

  async selfHealTest(testFile: string, errorOutput: string): Promise<string> {
    const prompt = `The following test is failing:

Test File:
\`\`\`typescript
${readFileSync(join(this.projectRoot, testFile), 'utf-8')}
\`\`\`

Error Output:
\`\`\`
${errorOutput}
\`\`\`

Please fix the test to make it pass. Consider:
1. Updating selectors if UI has changed
2. Adjusting assertions if expected behavior has changed
3. Adding retry logic for flaky operations
4. Updating mocks if dependencies have changed

Provide the complete fixed test file.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at fixing and improving tests. Make tests more resilient and self-healing.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    return response.choices?.[0]?.message?.content || '';
  }
}