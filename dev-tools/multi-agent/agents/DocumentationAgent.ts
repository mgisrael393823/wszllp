import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentTask, AgentResult, FileEdit } from '../types';

export class DocumentationAgent {
  constructor(private llmProvider?: any) {}

  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const edits: FileEdit[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      for (const filePath of task.files) {
        try {
          const docEdits = await this.updateDocumentation(filePath, task);
          if (docEdits.length > 0) {
            edits.push({
              filePath,
              edits: docEdits,
            });
          }

          // Check for README files
          const readmeEdit = await this.updateReadme(filePath, task);
          if (readmeEdit) {
            edits.push(readmeEdit);
          }
        } catch (error) {
          errors.push(`Failed to document ${filePath}: ${error}`);
        }
      }

      return {
        agentId: task.id,
        agentType: 'documentation',
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
        agentType: 'documentation',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Documentation failed'],
      };
    }
  }

  private async updateDocumentation(
    filePath: string,
    task: AgentTask
  ): Promise<Array<{ oldText: string; newText: string; description?: string }>> {
    const content = await fs.readFile(filePath, 'utf-8');
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    // Update JSDoc comments
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      const jsdocEdits = await this.updateJSDoc(content, filePath, task);
      edits.push(...jsdocEdits);
    }

    // Update inline comments
    const inlineCommentEdits = this.updateInlineComments(content, task);
    edits.push(...inlineCommentEdits);

    return edits;
  }

  private async updateJSDoc(
    content: string,
    filePath: string,
    task: AgentTask
  ): Promise<Array<{ oldText: string; newText: string; description?: string }>> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    if (this.llmProvider) {
      // Use LLM to generate intelligent documentation
      const docPlan = await this.planDocumentation(content, task);
      return this.executeDocumentationPlan(content, docPlan);
    }

    // Pattern-based JSDoc generation
    const patterns = [
      {
        // Functions without JSDoc
        regex: /^(?!.*\/\*\*).*?(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/gm,
        generator: (match: RegExpMatchArray) => {
          const funcName = match[1];
          const params = match[2];
          const returnType = match[3];
          
          let jsdoc = '/**\n';
          jsdoc += ` * ${this.generateDescription(funcName)}\n`;
          
          // Add parameter documentation
          if (params) {
            const paramList = params.split(',').map(p => p.trim());
            paramList.forEach(param => {
              const paramName = param.split(':')[0].trim();
              jsdoc += ` * @param {any} ${paramName} - TODO: Add description\n`;
            });
          }
          
          // Add return documentation
          if (returnType) {
            jsdoc += ` * @returns {${returnType.trim()}} TODO: Add description\n`;
          }
          
          jsdoc += ' */\n';
          
          return {
            oldText: match[0],
            newText: jsdoc + match[0],
            description: `Add JSDoc for function ${funcName}`,
          };
        },
      },
      {
        // Classes without JSDoc
        regex: /^(?!.*\/\*\*).*?(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/gm,
        generator: (match: RegExpMatchArray) => {
          const className = match[1];
          
          let jsdoc = '/**\n';
          jsdoc += ` * ${this.generateDescription(className)}\n`;
          jsdoc += ' */\n';
          
          return {
            oldText: match[0],
            newText: jsdoc + match[0],
            description: `Add JSDoc for class ${className}`,
          };
        },
      },
    ];

    for (const pattern of patterns) {
      const matches = Array.from(content.matchAll(pattern.regex));
      for (const match of matches) {
        const edit = pattern.generator(match);
        edits.push(edit);
      }
    }

    return edits;
  }

  private updateInlineComments(
    content: string,
    task: AgentTask
  ): Array<{ oldText: string; newText: string; description?: string }> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    // Add TODO comments for complex logic
    const complexPatterns = [
      {
        regex: /if\s*\([^)]{50,}\)\s*{/g,
        comment: '// TODO: Consider refactoring this complex condition',
      },
      {
        regex: /\.[a-zA-Z]+\([^)]*\)\.[a-zA-Z]+\([^)]*\)\.[a-zA-Z]+\([^)]*\)/g,
        comment: '// TODO: Consider breaking up this method chain',
      },
    ];

    for (const pattern of complexPatterns) {
      const matches = content.matchAll(pattern.regex);
      for (const match of matches) {
        edits.push({
          oldText: match[0],
          newText: `${pattern.comment}\n${match[0]}`,
          description: 'Add complexity warning comment',
        });
      }
    }

    return edits;
  }

  private async updateReadme(
    filePath: string,
    task: AgentTask
  ): Promise<FileEdit | null> {
    const dir = path.dirname(filePath);
    const readmePath = path.join(dir, 'README.md');

    try {
      // Check if README exists
      await fs.access(readmePath);
      
      // Update existing README
      const content = await fs.readFile(readmePath, 'utf-8');
      const updates = this.generateReadmeUpdates(content, task);
      
      if (updates.length > 0) {
        return {
          filePath: readmePath,
          edits: updates,
        };
      }
    } catch {
      // README doesn't exist, create one if this is a component directory
      if (this.shouldCreateReadme(filePath)) {
        const readmeContent = this.generateReadme(filePath, task);
        return {
          filePath: readmePath,
          edits: [{
            oldText: '',
            newText: readmeContent,
            description: 'Create README.md',
          }],
          isNewFile: true,
        };
      }
    }

    return null;
  }

  private generateReadmeUpdates(
    content: string,
    task: AgentTask
  ): Array<{ oldText: string; newText: string; description?: string }> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    // Update last modified date if present
    const dateRegex = /Last Updated:\s*\d{4}-\d{2}-\d{2}/g;
    const dateMatch = content.match(dateRegex);
    if (dateMatch) {
      edits.push({
        oldText: dateMatch[0],
        newText: `Last Updated: ${new Date().toISOString().split('T')[0]}`,
        description: 'Update last modified date',
      });
    }

    // Add change log entry
    if (content.includes('## Change Log') || content.includes('## Changelog')) {
      const changelogRegex = /(##\s*Change\s*[Ll]og.*?)(?=##|$)/s;
      const changelogMatch = content.match(changelogRegex);
      
      if (changelogMatch) {
        const newEntry = `\n\n### ${new Date().toISOString().split('T')[0]}\n- ${task.description}\n`;
        edits.push({
          oldText: changelogMatch[0],
          newText: changelogMatch[0] + newEntry,
          description: 'Add changelog entry',
        });
      }
    }

    return edits;
  }

  private shouldCreateReadme(filePath: string): boolean {
    const componentPatterns = [
      /components?[/\\]/i,
      /modules?[/\\]/i,
      /features?[/\\]/i,
    ];

    return componentPatterns.some(pattern => pattern.test(filePath));
  }

  private generateReadme(filePath: string, task: AgentTask): string {
    const componentName = path.basename(path.dirname(filePath));
    
    return `# ${componentName}

## Description

${task.description}

## Usage

\`\`\`typescript
// TODO: Add usage example
import { ${componentName} } from './${componentName}';
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| TODO | any | - | Add prop documentation |

## Examples

\`\`\`typescript
// TODO: Add examples
\`\`\`

## Change Log

### ${new Date().toISOString().split('T')[0]}
- Initial documentation created
- ${task.description}

---

Last Updated: ${new Date().toISOString().split('T')[0]}
`;
  }

  private generateDescription(name: string): string {
    // Convert camelCase/PascalCase to readable description
    const words = name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  private async planDocumentation(content: string, task: AgentTask): Promise<any[]> {
    const prompt = `
Analyze the following code and create documentation updates:

Task: ${task.description}

Code:
\`\`\`
${content}
\`\`\`

Generate documentation updates as a JSON array with:
- pattern: regex to match code that needs documentation
- documentation: the JSDoc or comment to add
- description: what this documentation explains

Focus on:
1. Undocumented functions and classes
2. Complex logic that needs explanation
3. API changes from the task
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

  private executeDocumentationPlan(content: string, plan: any[]): Array<{
    oldText: string;
    newText: string;
    description?: string;
  }> {
    const edits: Array<{ oldText: string; newText: string; description?: string }> = [];

    for (const item of plan) {
      try {
        const regex = new RegExp(item.pattern, 'gm');
        const matches = content.matchAll(regex);
        
        for (const match of matches) {
          edits.push({
            oldText: match[0],
            newText: item.documentation + '\n' + match[0],
            description: item.description,
          });
        }
      } catch (error) {
        console.error('Failed to execute documentation plan item:', error);
      }
    }

    return edits;
  }

  private countLinesAdded(edits: FileEdit[]): number {
    let count = 0;
    for (const fileEdit of edits) {
      for (const edit of fileEdit.edits) {
        count += edit.newText.split('\n').length - edit.oldText.split('\n').length;
      }
    }
    return Math.max(0, count);
  }
}