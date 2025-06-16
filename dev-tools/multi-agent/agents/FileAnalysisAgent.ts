import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { AgentTask, AgentResult, FileEdit } from '../types';

export class FileAnalysisAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const analysis: any = {
      fileStructure: {},
      dependencies: {},
      exports: {},
      imports: {},
      components: [],
      functions: [],
      classes: [],
    };

    try {
      for (const filePath of task.files) {
        const fileAnalysis = await this.analyzeFile(filePath);
        analysis.fileStructure[filePath] = fileAnalysis;
        
        // Aggregate findings
        if (fileAnalysis.dependencies) {
          analysis.dependencies[filePath] = fileAnalysis.dependencies;
        }
        if (fileAnalysis.exports) {
          analysis.exports[filePath] = fileAnalysis.exports;
        }
        if (fileAnalysis.imports) {
          analysis.imports[filePath] = fileAnalysis.imports;
        }
        if (fileAnalysis.components) {
          analysis.components.push(...fileAnalysis.components);
        }
        if (fileAnalysis.functions) {
          analysis.functions.push(...fileAnalysis.functions);
        }
        if (fileAnalysis.classes) {
          analysis.classes.push(...fileAnalysis.classes);
        }
      }

      return {
        agentId: task.id,
        agentType: 'file-analysis',
        status: 'success',
        edits: [], // Analysis doesn't produce edits
        analysis,
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
        agentType: 'file-analysis',
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : 'Analysis failed'],
      };
    }
  }

  async findRelevantFiles(scope: string[], description: string): Promise<string[]> {
    const files = new Set<string>();

    // Search patterns based on description
    const patterns = this.generateSearchPatterns(description);

    // Search within scope
    for (const dir of scope) {
      for (const pattern of patterns) {
        const matches = await glob(`${dir}/**/${pattern}`, {
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        });
        matches.forEach(f => files.add(f));
      }

      // Also search for files containing relevant keywords
      const keywords = this.extractKeywords(description);
      for (const keyword of keywords) {
        const keywordMatches = await this.searchFilesContaining(dir, keyword);
        keywordMatches.forEach(f => files.add(f));
      }
    }

    return Array.from(files);
  }

  private async analyzeFile(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath);

      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        return this.analyzeJavaScriptFile(content, filePath);
      } else if (['.css', '.scss', '.less'].includes(ext)) {
        return this.analyzeStyleFile(content, filePath);
      } else if (filePath.includes('test') || filePath.includes('spec')) {
        return this.analyzeTestFile(content, filePath);
      } else {
        return {
          type: 'other',
          lineCount: content.split('\n').length,
          size: content.length,
        };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to analyze',
      };
    }
  }

  private analyzeJavaScriptFile(content: string, filePath: string): any {
    const analysis: any = {
      type: 'javascript',
      lineCount: content.split('\n').length,
      imports: [],
      exports: [],
      components: [],
      functions: [],
      classes: [],
      dependencies: [],
    };

    // Extract imports
    const importRegex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      analysis.imports.push(importPath);
      if (!importPath.startsWith('.')) {
        analysis.dependencies.push(importPath);
      }
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.exports.push(match[1]);
    }

    // Extract React components
    const componentRegex = /(?:function|const)\s+([A-Z]\w+)\s*(?:\([^)]*\))?\s*(?::|=)/g;
    while ((match = componentRegex.exec(content)) !== null) {
      if (content.includes(`return`) && content.includes('<')) {
        analysis.components.push({
          name: match[1],
          type: 'functional',
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }

    // Extract functions
    const functionRegex = /(?:async\s+)?function\s+([a-z]\w+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push({
        name: match[1],
        async: match[0].includes('async'),
        line: content.substring(0, match.index).split('\n').length,
      });
    }

    // Extract classes
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push({
        name: match[1],
        extends: match[2],
        line: content.substring(0, match.index).split('\n').length,
      });
    }

    return analysis;
  }

  private analyzeStyleFile(content: string, filePath: string): any {
    const analysis: any = {
      type: 'style',
      lineCount: content.split('\n').length,
      selectors: [],
      variables: [],
      mixins: [],
    };

    // Extract CSS selectors
    const selectorRegex = /([.#][\w-]+)\s*{/g;
    let match;
    while ((match = selectorRegex.exec(content)) !== null) {
      analysis.selectors.push(match[1]);
    }

    // Extract CSS variables
    const variableRegex = /--([\w-]+):\s*([^;]+);/g;
    while ((match = variableRegex.exec(content)) !== null) {
      analysis.variables.push({
        name: match[1],
        value: match[2].trim(),
      });
    }

    return analysis;
  }

  private analyzeTestFile(content: string, filePath: string): any {
    const analysis: any = {
      type: 'test',
      lineCount: content.split('\n').length,
      describes: [],
      tests: [],
    };

    // Extract describe blocks
    const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = describeRegex.exec(content)) !== null) {
      analysis.describes.push(match[1]);
    }

    // Extract test cases
    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = testRegex.exec(content)) !== null) {
      analysis.tests.push(match[1]);
    }

    return analysis;
  }

  private generateSearchPatterns(description: string): string[] {
    const patterns: string[] = ['*.ts', '*.tsx', '*.js', '*.jsx'];
    const descLower = description.toLowerCase();

    // Add specific patterns based on description
    if (descLower.includes('component')) {
      patterns.push('*Component.tsx', '*Component.jsx');
    }
    if (descLower.includes('hook')) {
      patterns.push('use*.ts', 'use*.tsx');
    }
    if (descLower.includes('service')) {
      patterns.push('*Service.ts', '*Service.js');
    }
    if (descLower.includes('util')) {
      patterns.push('*util*.ts', '*util*.js');
    }
    if (descLower.includes('test')) {
      patterns.push('*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx');
    }

    return patterns;
  }

  private extractKeywords(description: string): string[] {
    // Extract meaningful keywords from description
    const words = description.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .map(word => word.replace(/[^a-z0-9]/g, ''))
      .filter(word => word.length > 0);
  }

  private async searchFilesContaining(dir: string, keyword: string): Promise<string[]> {
    const files: string[] = [];
    const fileList = await glob(`${dir}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    });

    for (const file of fileList) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          files.push(file);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return files;
  }
}