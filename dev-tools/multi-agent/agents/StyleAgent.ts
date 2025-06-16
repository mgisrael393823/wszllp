import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AgentTask, AgentResult, FileEdit } from '../types';

const execAsync = promisify(exec);

export class StyleAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const edits: FileEdit[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check available formatters
      const formatters = await this.detectFormatters();
      
      for (const filePath of task.files) {
        try {
          const fileEdits = await this.formatFile(filePath, formatters);
          if (fileEdits.length > 0) {
            edits.push({
              filePath,
              edits: fileEdits,
            });
          }
        } catch (error) {
          warnings.push(`Failed to format ${filePath}: ${error}`);
        }
      }

      // Run style checks
      const styleIssues = await this.runStyleChecks(task.files);
      warnings.push(...styleIssues);

      return {
        agentId: task.id,
        agentType: 'style',
        status: errors.length === 0 ? 'success' : 'partial',
        edits,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: edits.length,
          linesAdded: 0,
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'style',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Style formatting failed'],
      };
    }
  }

  private async detectFormatters(): Promise<Set<string>> {
    const formatters = new Set<string>();

    // Check for Prettier
    try {
      await execAsync('npx prettier --version');
      formatters.add('prettier');
    } catch {
      // Prettier not available
    }

    // Check for ESLint with --fix
    try {
      await execAsync('npx eslint --version');
      formatters.add('eslint');
    } catch {
      // ESLint not available
    }

    // Check for specific language formatters
    try {
      await execAsync('npx rustywind --version');
      formatters.add('rustywind'); // For Tailwind CSS class sorting
    } catch {
      // Rustywind not available
    }

    return formatters;
  }

  private async formatFile(
    filePath: string,
    formatters: Set<string>
  ): Promise<Array<{ oldText: string; newText: string; description?: string }>> {
    const originalContent = await fs.readFile(filePath, 'utf-8');
    let formattedContent = originalContent;

    // Apply formatters in sequence
    if (formatters.has('prettier') && this.isPrettierSupported(filePath)) {
      try {
        const { stdout } = await execAsync(`npx prettier --write ${filePath}`);
        formattedContent = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        console.error(`Prettier failed for ${filePath}:`, error);
      }
    }

    if (formatters.has('eslint') && this.isESLintSupported(filePath)) {
      try {
        await execAsync(`npx eslint --fix ${filePath}`);
        formattedContent = await fs.readFile(filePath, 'utf-8');
      } catch (error) {
        // ESLint returns non-zero exit code even after fixing
        // So we check if the file was actually modified
        const afterFix = await fs.readFile(filePath, 'utf-8');
        if (afterFix !== formattedContent) {
          formattedContent = afterFix;
        }
      }
    }

    // Apply custom style rules
    formattedContent = this.applyCustomStyleRules(formattedContent, filePath);

    // Create edit if content changed
    if (formattedContent !== originalContent) {
      // Restore original content for the edit system
      await fs.writeFile(filePath, originalContent);
      
      return [{
        oldText: originalContent,
        newText: formattedContent,
        description: 'Apply code formatting and style rules',
      }];
    }

    return [];
  }

  private isPrettierSupported(filePath: string): boolean {
    const supportedExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', 
      '.less', '.html', '.vue', '.yaml', '.yml', '.md'
    ];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  private isESLintSupported(filePath: string): boolean {
    const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
  }

  private applyCustomStyleRules(content: string, filePath: string): string {
    let updated = content;

    // JavaScript/TypeScript specific rules
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      // Ensure consistent spacing around operators
      updated = updated.replace(/(\w)\s*([+\-*/%=<>!&|]+)\s*(\w)/g, '$1 $2 $3');
      
      // Ensure space after keywords
      updated = updated.replace(/\b(if|for|while|switch|catch)\(/g, '$1 (');
      
      // Remove trailing whitespace
      updated = updated.replace(/[ \t]+$/gm, '');
      
      // Ensure newline at end of file
      if (!updated.endsWith('\n')) {
        updated += '\n';
      }

      // Convert tabs to spaces (if using spaces)
      // updated = updated.replace(/\t/g, '  ');
    }

    // CSS/SCSS specific rules
    if (filePath.match(/\.(css|scss|less)$/)) {
      // Ensure space after colon in properties
      updated = updated.replace(/([a-zA-Z-]+):(?!\s)/g, '$1: ');
      
      // Ensure semicolon at end of declarations
      updated = updated.replace(/([a-zA-Z0-9%)]+)\s*}/g, '$1;}');
      
      // Sort CSS properties alphabetically within blocks
      updated = this.sortCSSProperties(updated);
    }

    return updated;
  }

  private sortCSSProperties(css: string): string {
    // Simple CSS property sorting
    const blockRegex = /{([^}]*)}/g;
    
    return css.replace(blockRegex, (match, properties) => {
      const lines = properties.split('\n').filter(line => line.trim());
      const propertyLines = lines.filter(line => line.includes(':'));
      const otherLines = lines.filter(line => !line.includes(':'));
      
      // Sort property lines
      propertyLines.sort((a, b) => {
        const propA = a.trim().split(':')[0].trim();
        const propB = b.trim().split(':')[0].trim();
        return propA.localeCompare(propB);
      });
      
      const sortedLines = [...otherLines, ...propertyLines];
      return '{\n' + sortedLines.join('\n') + '\n}';
    });
  }

  private async runStyleChecks(files: string[]): Promise<string[]> {
    const issues: string[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for common style issues
        const fileIssues = this.checkStyleIssues(content, file);
        issues.push(...fileIssues);
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  private checkStyleIssues(content: string, filePath: string): string[] {
    const issues: string[] = [];
    const lines = content.split('\n');

    // Check line length
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push(`${filePath}:${index + 1} - Line exceeds 120 characters`);
      }
    });

    // Check for console.log statements
    if (filePath.match(/\.(js|jsx|ts|tsx)$/) && !filePath.includes('test')) {
      const consoleMatches = content.match(/console\.(log|error|warn|info)/g);
      if (consoleMatches) {
        issues.push(`${filePath} - Contains ${consoleMatches.length} console statements`);
      }
    }

    // Check for TODO comments
    const todoMatches = content.match(/\/\/\s*TODO|\/\*\s*TODO/gi);
    if (todoMatches) {
      issues.push(`${filePath} - Contains ${todoMatches.length} TODO comments`);
    }

    // Check for inconsistent indentation
    const indentations = new Set<number>();
    lines.forEach(line => {
      const match = line.match(/^(\s+)/);
      if (match) {
        indentations.add(match[1].length);
      }
    });

    if (indentations.size > 0) {
      const indentLevels = Array.from(indentations).sort((a, b) => a - b);
      const expectedIndent = indentLevels[0];
      
      const inconsistent = indentLevels.some(level => level % expectedIndent !== 0);
      if (inconsistent) {
        issues.push(`${filePath} - Inconsistent indentation detected`);
      }
    }

    return issues;
  }
}