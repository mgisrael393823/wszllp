import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AgentTask, AgentResult, ValidationError } from '../types';

const execAsync = promisify(exec);

export class ValidationAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Run multiple validation checks in parallel
      const validationResults = await Promise.allSettled([
        this.validateSyntax(task.files),
        this.validateTypes(task.files),
        this.runLinter(task.files),
        this.runTests(),
      ]);

      // Process results
      for (const [index, result] of validationResults.entries()) {
        if (result.status === 'rejected') {
          errors.push(`Validation ${index} failed: ${result.reason}`);
        } else if (result.value.errors) {
          errors.push(...result.value.errors);
        } else if (result.value.warnings) {
          warnings.push(...result.value.warnings);
        }
      }

      return {
        agentId: task.id,
        agentType: 'validation',
        status: errors.length === 0 ? 'success' : 'failed',
        edits: [],
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: 0,
          linesAdded: 0,
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'validation',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      };
    }
  }

  private async validateSyntax(files: string[]): Promise<{
    errors?: string[];
    warnings?: string[];
  }> {
    const errors: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Basic syntax checks
        if (file.endsWith('.json')) {
          try {
            JSON.parse(content);
          } catch (e) {
            errors.push(`Invalid JSON in ${file}: ${e}`);
          }
        }

        // Check for common syntax errors
        if (file.match(/\.(js|jsx|ts|tsx)$/)) {
          const syntaxErrors = this.checkJavaScriptSyntax(content, file);
          errors.push(...syntaxErrors);
        }
      } catch (error) {
        errors.push(`Could not read ${file}: ${error}`);
      }
    }

    return { errors: errors.length > 0 ? errors : undefined };
  }

  private checkJavaScriptSyntax(content: string, file: string): string[] {
    const errors: string[] = [];

    // Check for unmatched brackets
    const brackets = { '(': ')', '{': '}', '[': ']' };
    const stack: string[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      for (const char of line) {
        if (Object.keys(brackets).includes(char)) {
          stack.push(char);
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop();
          if (!last || brackets[last as keyof typeof brackets] !== char) {
            errors.push(`${file}:${i + 1} - Unmatched bracket: ${char}`);
          }
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`${file} - Unclosed brackets: ${stack.join(', ')}`);
    }

    // Check for trailing commas in old JS
    if (file.endsWith('.js') && content.includes(',]') || content.includes(',}')) {
      errors.push(`${file} - Trailing commas found (may cause issues in older JS environments)`);
    }

    return errors;
  }

  private async validateTypes(files: string[]): Promise<{
    errors?: string[];
    warnings?: string[];
  }> {
    const tsFiles = files.filter(f => f.match(/\.tsx?$/));
    
    if (tsFiles.length === 0) {
      return {};
    }

    try {
      // Run TypeScript compiler
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      
      if (stderr) {
        const errors = stderr.split('\n').filter(line => line.trim());
        return { errors };
      }

      return {};
    } catch (error: any) {
      // Parse TypeScript errors from stdout
      const output = error.stdout || '';
      const errors = output
        .split('\n')
        .filter((line: string) => line.includes('error TS'))
        .map((line: string) => line.trim());

      return { errors: errors.length > 0 ? errors : ['TypeScript validation failed'] };
    }
  }

  private async runLinter(files: string[]): Promise<{
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Check if ESLint is available
      await execAsync('npx eslint --version');

      // Run ESLint on files
      const fileList = files.filter(f => f.match(/\.(js|jsx|ts|tsx)$/)).join(' ');
      
      if (!fileList) return {};

      const { stdout } = await execAsync(`npx eslint ${fileList} --format json`, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      const results = JSON.parse(stdout);
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const result of results) {
        for (const message of result.messages) {
          const msg = `${result.filePath}:${message.line}:${message.column} - ${message.message}`;
          
          if (message.severity === 2) {
            errors.push(msg);
          } else {
            warnings.push(msg);
          }
        }
      }

      return {
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error: any) {
      // ESLint returns non-zero exit code when there are linting errors
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          const errors: string[] = [];
          const warnings: string[] = [];

          for (const result of results) {
            for (const message of result.messages) {
              const msg = `${result.filePath}:${message.line}:${message.column} - ${message.message}`;
              
              if (message.severity === 2) {
                errors.push(msg);
              } else {
                warnings.push(msg);
              }
            }
          }

          return {
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
          };
        } catch {
          // If we can't parse the output, just return a generic warning
          return { warnings: ['Linting completed with issues'] };
        }
      }

      return { warnings: ['ESLint not available or failed to run'] };
    }
  }

  private async runTests(): Promise<{
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Detect test runner
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      let testCommand = 'npm test';
      if (scripts.test) {
        testCommand = 'npm test -- --passWithNoTests';
      } else if (packageJson.devDependencies?.jest) {
        testCommand = 'npx jest --passWithNoTests';
      } else if (packageJson.devDependencies?.vitest) {
        testCommand = 'npx vitest run --passWithNoTests';
      } else {
        return { warnings: ['No test runner detected'] };
      }

      const { stdout, stderr } = await execAsync(testCommand, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      // Parse test results
      if (stderr && !stderr.includes('PASS')) {
        return { errors: ['Tests failed: ' + stderr] };
      }

      if (stdout.includes('FAIL')) {
        const failedTests = stdout
          .split('\n')
          .filter(line => line.includes('FAIL'))
          .map(line => line.trim());
        
        return { errors: failedTests };
      }

      return {};
    } catch (error: any) {
      // Tests failed
      const output = error.stdout || error.stderr || '';
      const errors = output
        .split('\n')
        .filter((line: string) => 
          line.includes('FAIL') || 
          line.includes('Error:') || 
          line.includes('✗')
        )
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      return { 
        errors: errors.length > 0 ? errors : ['Test suite failed to run'] 
      };
    }
  }
}