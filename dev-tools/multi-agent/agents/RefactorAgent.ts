import * as fs from 'fs/promises';
import { AgentTask, AgentResult, FileEdit, CodebaseContext } from '../types';

export class RefactorAgent {
  constructor(private llmProvider?: any) {}

  async execute(task: AgentTask, context: CodebaseContext): Promise<AgentResult> {
    const startTime = Date.now();
    const edits: FileEdit[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      for (const filePath of task.files) {
        try {
          const fileEdits = await this.refactorFile(filePath, task, context);
          if (fileEdits.length > 0) {
            edits.push({
              filePath,
              edits: fileEdits,
            });
          }
        } catch (error) {
          errors.push(`Failed to refactor ${filePath}: ${error}`);
        }
      }

      // Calculate metrics
      const metrics = {
        filesAnalyzed: task.files.length,
        filesModified: edits.length,
        linesAdded: this.countLinesAdded(edits),
        linesRemoved: this.countLinesRemoved(edits),
        duration: Date.now() - startTime,
      };

      return {
        agentId: task.id,
        agentType: 'refactor',
        status: errors.length === 0 ? 'success' : 'partial',
        edits,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        metrics,
      };
    } catch (error) {
      return {
        agentId: task.id,
        agentType: 'refactor',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Refactoring failed'],
      };
    }
  }

  private async refactorFile(
    filePath: string,
    task: AgentTask,
    context: CodebaseContext
  ): Promise<Array<{ oldText: string; newText: string; description?: string }>> {
    const content = await fs.readFile(filePath, 'utf-8');
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    // If LLM provider is available, use it for intelligent refactoring
    if (this.llmProvider) {
      const refactoringPlan = await this.planRefactoring(content, task, context);
      return this.executeRefactoringPlan(content, refactoringPlan);
    }

    // Otherwise, perform pattern-based refactoring
    const patterns = this.getRefactoringPatterns(task.description);
    
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

  private async planRefactoring(
    content: string,
    task: AgentTask,
    context: CodebaseContext
  ): Promise<any> {
    const prompt = `
You are a code refactoring specialist. Analyze the following code and create a refactoring plan.

Task: ${task.description}
File Type: ${context.languages.join(', ')}
Frameworks: ${context.frameworks.join(', ')}

Code:
\`\`\`
${content}
\`\`\`

Constraints:
- Preserve API: ${task.constraints?.preserveApi ? 'Yes' : 'No'}
- Allow Breaking Changes: ${task.constraints?.allowBreakingChanges ? 'Yes' : 'No'}

Provide a JSON array of refactoring operations with:
- pattern: regex pattern to match
- replacement: new text
- description: what this change does
`;

    const response = await this.llmProvider.complete({
      prompt,
      maxTokens: 2000,
      temperature: 0.2,
    });

    try {
      return JSON.parse(response.text);
    } catch {
      return [];
    }
  }

  private executeRefactoringPlan(content: string, plan: any[]): Array<{
    oldText: string;
    newText: string;
    description?: string;
  }> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    for (const operation of plan) {
      try {
        const regex = new RegExp(operation.pattern, 'g');
        const matches = content.matchAll(regex);
        
        for (const match of matches) {
          edits.push({
            oldText: match[0],
            newText: operation.replacement,
            description: operation.description,
          });
        }
      } catch (error) {
        console.error('Failed to execute refactoring operation:', error);
      }
    }

    return edits;
  }

  private getRefactoringPatterns(description: string): Array<{
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

    // Convert class components to functional components
    if (descLower.includes('functional') || descLower.includes('hooks')) {
      patterns.push({
        regex: /class\s+(\w+)\s+extends\s+(?:React\.)?Component\s*{([^}]+)}/g,
        replacement: (match) => {
          const name = match[1];
          const body = match[2];
          return `function ${name}(props) {\n${this.convertClassBody(body)}\n}`;
        },
        description: 'Convert class component to functional component',
      });
    }

    // Update imports
    if (descLower.includes('import') || descLower.includes('module')) {
      patterns.push({
        regex: /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
        replacement: (match) => {
          const name = match[1];
          const path = match[2];
          // Update old-style imports
          if (path.endsWith('/index')) {
            return `import ${name} from '${path.slice(0, -6)}'`;
          }
          return match[0];
        },
        description: 'Clean up import paths',
      });
    }

    // Convert CommonJS to ES modules
    if (descLower.includes('es module') || descLower.includes('esm')) {
      patterns.push({
        regex: /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        replacement: (match) => `import ${match[1]} from '${match[2]}'`,
        description: 'Convert CommonJS to ES modules',
      });

      patterns.push({
        regex: /module\.exports\s*=\s*{([^}]+)}/g,
        replacement: (match) => {
          const exports = match[1].trim().split(',').map(e => e.trim());
          return exports.map(e => `export { ${e} }`).join('\n');
        },
        description: 'Convert module.exports to ES exports',
      });
    }

    // Arrow function conversion
    if (descLower.includes('arrow')) {
      patterns.push({
        regex: /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
        replacement: (match) => `const ${match[1]} = (${match[2]}) => {`,
        description: 'Convert function declaration to arrow function',
      });
    }

    // Async/await conversion
    if (descLower.includes('async') || descLower.includes('await')) {
      patterns.push({
        regex: /\.then\s*\(\s*(?:\(([^)]*)\)\s*=>|function\s*\(([^)]*)\))\s*{([^}]+)}\s*\)/g,
        replacement: (match) => {
          const params = match[1] || match[2] || '';
          const body = match[3];
          return `\nconst ${params || 'result'} = await ${match.input?.split('.then')[0]};\n${body}`;
        },
        description: 'Convert .then() to async/await',
      });
    }

    return patterns;
  }

  private convertClassBody(body: string): string {
    // Simple conversion - in real implementation, use AST
    let converted = body;

    // Convert state
    converted = converted.replace(
      /state\s*=\s*{([^}]+)}/,
      (match, stateObj) => {
        const states = stateObj.split(',').map((s: string) => {
          const [key, value] = s.split(':').map((p: string) => p.trim());
          return `const [${key}, set${key.charAt(0).toUpperCase() + key.slice(1)}] = useState(${value})`;
        });
        return states.join('\n');
      }
    );

    // Convert methods to functions
    converted = converted.replace(
      /(\w+)\s*\(([^)]*)\)\s*{/g,
      (match, name, params) => {
        if (name === 'render') return 'return (';
        return `const ${name} = (${params}) => {`;
      }
    );

    // Convert this.state to state variables
    converted = converted.replace(/this\.state\.(\w+)/g, '$1');

    // Convert this.setState
    converted = converted.replace(
      /this\.setState\s*\(\s*{\s*(\w+):\s*([^}]+)\s*}\s*\)/g,
      (match, key, value) => `set${key.charAt(0).toUpperCase() + key.slice(1)}(${value})`
    );

    return converted;
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

  private countLinesRemoved(edits: FileEdit[]): number {
    let count = 0;
    for (const fileEdit of edits) {
      for (const edit of fileEdit.edits) {
        count += edit.oldText.split('\n').length;
      }
    }
    return count;
  }
}