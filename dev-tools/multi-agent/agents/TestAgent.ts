import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentTask, AgentResult, FileEdit, CodebaseContext } from '../types';

export class TestAgent {
  constructor(private llmProvider?: any) {}

  async execute(task: AgentTask, context: CodebaseContext): Promise<AgentResult> {
    const startTime = Date.now();
    const edits: FileEdit[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Determine test framework
      const testFramework = context.testFramework || 'jest';

      // Process each file
      for (const filePath of task.files) {
        try {
          // Check if this is a test file or source file
          const isTestFile = this.isTestFile(filePath);
          
          if (isTestFile) {
            // Update existing test
            const testEdits = await this.updateTestFile(filePath, task, context);
            if (testEdits.length > 0) {
              edits.push({
                filePath,
                edits: testEdits,
              });
            }
          } else {
            // Create test for source file
            const testFilePath = this.getTestFilePath(filePath, context);
            const testContent = await this.generateTestFile(filePath, task, context);
            
            if (testContent) {
              edits.push({
                filePath: testFilePath,
                edits: [{
                  oldText: '',
                  newText: testContent,
                  description: `Create test file for ${path.basename(filePath)}`,
                }],
                isNewFile: true,
              });
            }
          }
        } catch (error) {
          errors.push(`Failed to process ${filePath}: ${error}`);
        }
      }

      return {
        agentId: task.id,
        agentType: 'test',
        status: errors.length === 0 ? 'success' : 'partial',
        edits,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metrics: {
          filesAnalyzed: task.files.length,
          filesModified: edits.length,
          linesAdded: this.countLinesAdded(edits),
          linesRemoved: 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'test',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Test generation failed'],
      };
    }
  }

  private isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
  }

  private getTestFilePath(sourcePath: string, context: CodebaseContext): string {
    const dir = path.dirname(sourcePath);
    const ext = path.extname(sourcePath);
    const base = path.basename(sourcePath, ext);
    
    // Determine test file extension
    const testExt = context.testFramework === 'jest' ? '.test' : '.spec';
    
    return path.join(dir, `${base}${testExt}${ext}`);
  }

  private async updateTestFile(
    filePath: string,
    task: AgentTask,
    context: CodebaseContext
  ): Promise<Array<{ oldText: string; newText: string; description?: string }>> {
    const content = await fs.readFile(filePath, 'utf-8');
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    if (this.llmProvider) {
      // Use LLM to intelligently update tests
      const updates = await this.planTestUpdates(content, task, context);
      return this.executeTestUpdates(content, updates);
    }

    // Pattern-based test updates
    const patterns = this.getTestUpdatePatterns(task.description);
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern.regex);
      for (const match of matches) {
        edits.push({
          oldText: match[0],
          newText: pattern.replacement(match),
          description: pattern.description,
        });
      }
    }

    return edits;
  }

  private async generateTestFile(
    sourcePath: string,
    task: AgentTask,
    context: CodebaseContext
  ): Promise<string | null> {
    try {
      const sourceContent = await fs.readFile(sourcePath, 'utf-8');
      const analysis = this.analyzeSourceFile(sourceContent);

      if (this.llmProvider) {
        return this.generateTestWithLLM(sourcePath, sourceContent, analysis, context);
      }

      // Generate basic test template
      return this.generateTestTemplate(sourcePath, analysis, context);
    } catch (error) {
      return null;
    }
  }

  private analyzeSourceFile(content: string): any {
    const analysis = {
      exports: [] as string[],
      functions: [] as string[],
      classes: [] as string[],
      components: [] as string[],
    };

    // Find exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.exports.push(match[1]);
    }

    // Find functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }

    // Find classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }

    // Find React components
    const componentRegex = /(?:export\s+)?(?:const|function)\s+([A-Z]\w+)\s*[=:]/g;
    while ((match = componentRegex.exec(content)) !== null) {
      if (content.includes('return') && content.includes('<')) {
        analysis.components.push(match[1]);
      }
    }

    return analysis;
  }

  private async generateTestWithLLM(
    sourcePath: string,
    sourceContent: string,
    analysis: any,
    context: CodebaseContext
  ): Promise<string> {
    const prompt = `
Generate comprehensive tests for the following code:

File: ${sourcePath}
Test Framework: ${context.testFramework}
Project Type: ${context.projectType}

Source Code:
\`\`\`
${sourceContent}
\`\`\`

Analysis:
- Exports: ${analysis.exports.join(', ')}
- Functions: ${analysis.functions.join(', ')}
- Classes: ${analysis.classes.join(', ')}
- Components: ${analysis.components.join(', ')}

Generate tests that:
1. Cover all exported functions and classes
2. Test edge cases and error conditions
3. Mock external dependencies appropriately
4. Follow ${context.testFramework} best practices
`;

    const response = await this.llmProvider.complete({
      prompt,
      maxTokens: 3000,
      temperature: 0.3,
    });

    return response.text;
  }

  private generateTestTemplate(
    sourcePath: string,
    analysis: any,
    context: CodebaseContext
  ): string {
    const fileName = path.basename(sourcePath);
    const importPath = `./${path.basename(sourcePath, path.extname(sourcePath))}`;
    
    let template = '';

    // Import statements
    if (context.testFramework === 'jest') {
      template += `import { ${analysis.exports.join(', ')} } from '${importPath}';\n\n`;
    } else if (context.testFramework === 'vitest') {
      template += `import { describe, it, expect, vi } from 'vitest';\n`;
      template += `import { ${analysis.exports.join(', ')} } from '${importPath}';\n\n`;
    }

    // Test suites
    template += `describe('${fileName}', () => {\n`;

    // Generate tests for functions
    for (const func of analysis.functions) {
      template += `  describe('${func}', () => {\n`;
      template += `    it('should work correctly', () => {\n`;
      template += `      // TODO: Implement test\n`;
      template += `      expect(${func}()).toBeDefined();\n`;
      template += `    });\n\n`;
      template += `    it('should handle edge cases', () => {\n`;
      template += `      // TODO: Test edge cases\n`;
      template += `    });\n`;
      template += `  });\n\n`;
    }

    // Generate tests for classes
    for (const cls of analysis.classes) {
      template += `  describe('${cls}', () => {\n`;
      template += `    it('should instantiate correctly', () => {\n`;
      template += `      const instance = new ${cls}();\n`;
      template += `      expect(instance).toBeInstanceOf(${cls});\n`;
      template += `    });\n`;
      template += `  });\n\n`;
    }

    // Generate tests for React components
    for (const component of analysis.components) {
      template += `  describe('${component}', () => {\n`;
      template += `    it('should render without crashing', () => {\n`;
      template += `      // TODO: Add React Testing Library imports and test\n`;
      template += `      // const { getByText } = render(<${component} />);\n`;
      template += `      // expect(getByText('...')).toBeInTheDocument();\n`;
      template += `    });\n`;
      template += `  });\n\n`;
    }

    template += '});\n';

    return template;
  }

  private async planTestUpdates(
    content: string,
    task: AgentTask,
    context: CodebaseContext
  ): Promise<any[]> {
    const prompt = `
Update the following test file based on the task:

Task: ${task.description}
Test Framework: ${context.testFramework}

Current Test File:
\`\`\`
${content}
\`\`\`

Provide updates as a JSON array with:
- pattern: regex to match existing test
- replacement: updated test code
- description: what changed
`;

    const response = await this.llmProvider.complete({
      prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    try {
      return JSON.parse(response.text);
    } catch {
      return [];
    }
  }

  private executeTestUpdates(content: string, updates: any[]): Array<{
    oldText: string;
    newText: string;
    description?: string;
  }> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    for (const update of updates) {
      try {
        const regex = new RegExp(update.pattern, 'g');
        const matches = content.matchAll(regex);
        
        for (const match of matches) {
          edits.push({
            oldText: match[0],
            newText: update.replacement,
            description: update.description,
          });
        }
      } catch (error) {
        console.error('Failed to execute test update:', error);
      }
    }

    return edits;
  }

  private getTestUpdatePatterns(description: string): Array<{
    regex: RegExp;
    replacement: (match: RegExpMatchArray) => string;
    description: string;
  }> {
    const patterns: Array<{
      regex: RegExp;
      replacement: (match: RegExpMatchArray) => string;
      description: string;
    }> = [];

    const descLower = description.toLowerCase();

    // Update expect statements
    if (descLower.includes('assertion') || descLower.includes('expect')) {
      patterns.push({
        regex: /expect\(([^)]+)\)\.toBe\(([^)]+)\)/g,
        replacement: (match) => `expect(${match[1]}).toEqual(${match[2]})`,
        description: 'Update toBe to toEqual for better object comparison',
      });
    }

    // Add async/await to tests
    if (descLower.includes('async')) {
      patterns.push({
        regex: /it\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>\s*{/g,
        replacement: (match) => `it('${match[1]}', async () => {`,
        description: 'Make test async',
      });
    }

    return patterns;
  }

  private countLinesAdded(edits: FileEdit[]): number {
    let count = 0;
    for (const fileEdit of edits) {
      for (const edit of fileEdit.edits) {
        count += edit.newText.split('\n').length;
      }
    }
    return count;
  }
}