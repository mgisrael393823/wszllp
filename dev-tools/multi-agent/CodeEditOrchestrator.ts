import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CodeEditTask,
  AgentTask,
  AgentResult,
  EditPlan,
  ChangeSet,
  ValidationResult,
  FileEdit,
  CodebaseContext,
} from './types';
import { FileAnalysisAgent } from './agents/FileAnalysisAgent';
import { RefactorAgent } from './agents/RefactorAgent';
import { TestAgent } from './agents/TestAgent';
import { DocumentationAgent } from './agents/DocumentationAgent';
import { StyleAgent } from './agents/StyleAgent';
import { ValidationAgent } from './agents/ValidationAgent';
import { DesignAnalysisAgent } from './agents/DesignAnalysisAgent';
import { ThemeExtractionAgent } from './agents/ThemeExtractionAgent';
import { DesignReviewAgent } from './agents/DesignReviewAgent';
import { ChangeTracker } from './utils/ChangeTracker';
import { DependencyAnalyzer } from './utils/DependencyAnalyzer';
import { v4 as uuidv4 } from 'uuid';

export class CodeEditOrchestrator extends EventEmitter {
  private fileAnalysisAgent: FileAnalysisAgent;
  private refactorAgent: RefactorAgent;
  private testAgent: TestAgent;
  private documentationAgent: DocumentationAgent;
  private styleAgent: StyleAgent;
  private validationAgent: ValidationAgent;
  private designAnalysisAgent: DesignAnalysisAgent;
  private themeExtractionAgent: ThemeExtractionAgent;
  private designReviewAgent: DesignReviewAgent;
  private changeTracker: ChangeTracker;
  private dependencyAnalyzer: DependencyAnalyzer;
  private codebaseContext?: CodebaseContext;

  constructor(private config?: {
    maxConcurrentAgents?: number;
    enableDryRun?: boolean;
    autoValidate?: boolean;
    llmProvider?: any;
  }) {
    super();
    
    // Initialize agents
    this.fileAnalysisAgent = new FileAnalysisAgent();
    this.refactorAgent = new RefactorAgent(config?.llmProvider);
    this.testAgent = new TestAgent(config?.llmProvider);
    this.documentationAgent = new DocumentationAgent(config?.llmProvider);
    this.styleAgent = new StyleAgent();
    this.validationAgent = new ValidationAgent();
    this.designAnalysisAgent = new DesignAnalysisAgent();
    this.themeExtractionAgent = new ThemeExtractionAgent();
    this.designReviewAgent = new DesignReviewAgent();
    
    // Initialize utilities
    this.changeTracker = new ChangeTracker();
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  async execute(task: CodeEditTask): Promise<ChangeSet> {
    this.emit('task:start', { task });

    try {
      // Phase 1: Analyze codebase context
      this.emit('phase:start', { phase: 'analysis' });
      this.codebaseContext = await this.analyzeCodebase();
      
      // Phase 2: Analyze task and create plan
      this.emit('phase:start', { phase: 'planning' });
      const plan = await this.createEditPlan(task);
      this.emit('plan:created', { plan });

      // Phase 3: Execute plan with agents
      this.emit('phase:start', { phase: 'execution' });
      const results = await this.executePlan(plan);
      
      // Phase 4: Aggregate and validate changes
      this.emit('phase:start', { phase: 'validation' });
      const changeSet = await this.aggregateResults(results, task);
      
      // Phase 5: Apply changes (if not dry run)
      if (!this.config?.enableDryRun) {
        await this.applyChanges(changeSet);
      }

      this.emit('task:complete', { changeSet });
      return changeSet;

    } catch (error) {
      this.emit('task:error', { error });
      throw error;
    }
  }

  private async analyzeCodebase(): Promise<CodebaseContext> {
    // Analyze project structure and configuration
    const packageJson = await this.readPackageJson();
    const projectType = this.detectProjectType(packageJson);
    const languages = await this.detectLanguages();
    const frameworks = this.detectFrameworks(packageJson);
    
    return {
      projectType,
      languages,
      frameworks,
      testFramework: this.detectTestFramework(packageJson),
      styleGuide: await this.detectStyleGuide(),
      buildSystem: this.detectBuildSystem(packageJson),
      dependencies: packageJson.dependencies || {},
    };
  }

  private async createEditPlan(task: CodeEditTask): Promise<EditPlan> {
    // Analyze task complexity
    const complexity = this.analyzeTaskComplexity(task);
    
    // Find relevant files
    const relevantFiles = await this.fileAnalysisAgent.findRelevantFiles(
      task.scope,
      task.description
    );

    // Analyze dependencies
    const dependencies = await this.dependencyAnalyzer.analyze(relevantFiles);

    // Create agent tasks based on analysis
    const agentTasks: AgentTask[] = [];

    // Always start with file analysis
    const fileAnalysisId = uuidv4();
    agentTasks.push({
      id: fileAnalysisId,
      agentType: 'file-analysis',
      description: `Analyze files for: ${task.description}`,
      files: relevantFiles,
      priority: 'high',
    });

    // Add refactoring tasks (skip for design analysis tasks)
    const isDesignTask = task.description.toLowerCase().match(/design|theme|ui|style|css|color|spacing|typography|modern|analyze/);
    const refactorIds: string[] = [];
    
    if (!isDesignTask || task.description.toLowerCase().includes('modernize')) {
      const refactorGroups = this.groupFilesByComponent(relevantFiles);
      for (const [component, files] of refactorGroups.entries()) {
        const refactorId = uuidv4();
        refactorIds.push(refactorId);
        agentTasks.push({
          id: refactorId,
          agentType: 'refactor',
          description: `Refactor ${component}: ${task.description}`,
          files,
          priority: 'high',
          dependencies: [fileAnalysisId],
          constraints: task.constraints,
        });
      }
    }

    // Add test tasks if needed
    if (task.constraints?.updateTests !== false) {
      const testFiles = await this.findTestFiles(relevantFiles);
      if (testFiles.length > 0 || this.shouldCreateTests(task)) {
        agentTasks.push({
          id: uuidv4(),
          agentType: 'test',
          description: `Update tests for: ${task.description}`,
          files: testFiles,
          priority: 'medium',
          dependencies: refactorIds.length > 0 ? refactorIds : [fileAnalysisId],
        });
      }
    }

    // Add documentation tasks if needed
    if (task.constraints?.updateDocs !== false) {
      agentTasks.push({
        id: uuidv4(),
        agentType: 'documentation',
        description: `Update documentation for: ${task.description}`,
        files: relevantFiles,
        priority: 'low',
        dependencies: ['refactor'],
      });
    }

    // Add design-related tasks if description mentions design, theme, or UI
    const isReviewOnly = task.context?.isReviewOnly || task.context?.requestType === 'design-review';
    
    if (isDesignTask) {
      if (isReviewOnly) {
        // For review-only requests, just add design review task
        agentTasks.push({
          id: uuidv4(),
          agentType: 'design-review',
          description: `Review and provide recommendations for: ${task.description}`,
          files: relevantFiles,
          priority: 'high',
          dependencies: [fileAnalysisId],
        });
      } else {
        // For implementation requests, add analysis and extraction tasks
        const designAnalysisId = uuidv4();
        agentTasks.push({
          id: designAnalysisId,
          agentType: 'design-analysis',
          description: `Analyze design patterns for: ${task.description}`,
          files: relevantFiles,
          priority: 'high',
          dependencies: [fileAnalysisId],
        });

        // Add theme extraction task
        if (task.description.toLowerCase().includes('theme') || task.description.toLowerCase().includes('token')) {
          agentTasks.push({
            id: uuidv4(),
            agentType: 'theme-extraction',
            description: `Extract design tokens for: ${task.description}`,
            files: relevantFiles,
            priority: 'high',
            dependencies: [designAnalysisId],
          });
        }
      }
    }

    // Always add style validation
    agentTasks.push({
      id: uuidv4(),
      agentType: 'style',
      description: 'Ensure code style consistency',
      files: relevantFiles,
      priority: 'low',
      dependencies: ['refactor', 'test'],
    });

    return {
      tasks: agentTasks,
      executionOrder: this.determineExecutionOrder(agentTasks),
      estimatedDuration: this.estimateDuration(agentTasks),
      affectedFiles: relevantFiles,
      riskLevel: this.assessRiskLevel(task, relevantFiles),
    };
  }

  private async executePlan(plan: EditPlan): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const taskMap = new Map(plan.tasks.map(t => [t.id, t]));
    const completed = new Set<string>();

    // Execute tasks based on execution order
    if (plan.executionOrder === 'parallel') {
      // Execute all independent tasks in parallel
      const independentTasks = plan.tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
      const parallelResults = await Promise.all(
        independentTasks.map(task => this.executeAgentTask(task))
      );
      results.push(...parallelResults);
      independentTasks.forEach(t => completed.add(t.id));

      // Execute dependent tasks
      const dependentTasks = plan.tasks.filter(t => t.dependencies && t.dependencies.length > 0);
      for (const task of dependentTasks) {
        await this.waitForDependencies(task.dependencies, completed);
        const result = await this.executeAgentTask(task);
        results.push(result);
        completed.add(task.id);
      }
    } else {
      // Sequential execution
      for (const task of plan.tasks) {
        if (task.dependencies) {
          await this.waitForDependencies(task.dependencies, completed);
        }
        const result = await this.executeAgentTask(task);
        results.push(result);
        completed.add(task.id);
        this.emit('agent:complete', { task, result });
      }
    }

    return results;
  }

  private async executeAgentTask(task: AgentTask): Promise<AgentResult> {
    this.emit('agent:start', { task });

    try {
      switch (task.agentType) {
        case 'file-analysis':
          return await this.fileAnalysisAgent.execute(task);
        
        case 'refactor':
          return await this.refactorAgent.execute(task, this.codebaseContext!);
        
        case 'test':
          return await this.testAgent.execute(task, this.codebaseContext!);
        
        case 'documentation':
          return await this.documentationAgent.execute(task);
        
        case 'style':
          return await this.styleAgent.execute(task);
        
        case 'validation':
          return await this.validationAgent.execute(task);
        
        case 'design-analysis':
          return await this.designAnalysisAgent.execute(task);
        
        case 'theme-extraction':
          return await this.themeExtractionAgent.execute(task);
        
        case 'design-review':
          return await this.designReviewAgent.execute(task);
        
        default:
          throw new Error(`Unknown agent type: ${task.agentType}`);
      }
    } catch (error) {
      this.emit('agent:error', { task, error });
      return {
        agentId: task.id,
        agentType: task.agentType,
        status: 'failed',
        edits: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private async aggregateResults(
    results: AgentResult[],
    task: CodeEditTask
  ): Promise<ChangeSet> {
    // Collect all file edits
    const allEdits: FileEdit[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const result of results) {
      if (result.status === 'success' || result.status === 'partial') {
        allEdits.push(...result.edits);
      }
      if (result.errors) {
        errors.push(...result.errors);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }

    // Merge edits for the same file
    const mergedEdits = this.mergeFileEdits(allEdits);

    // Validate the complete change set
    const validation = await this.validateChanges(mergedEdits);

    // Create change set
    const changeSet: ChangeSet = {
      id: uuidv4(),
      description: task.description,
      edits: mergedEdits,
      validation,
      applied: false,
      timestamp: new Date(),
    };

    // Track changes for potential rollback
    if (!this.config?.enableDryRun) {
      changeSet.rollbackData = await this.changeTracker.prepareRollback(mergedEdits);
    }

    return changeSet;
  }

  private mergeFileEdits(edits: FileEdit[]): FileEdit[] {
    const fileMap = new Map<string, FileEdit>();

    for (const edit of edits) {
      if (fileMap.has(edit.filePath)) {
        // Merge edits for the same file
        const existing = fileMap.get(edit.filePath)!;
        existing.edits.push(...edit.edits);
      } else {
        fileMap.set(edit.filePath, {
          ...edit,
          edits: [...edit.edits],
        });
      }
    }

    return Array.from(fileMap.values());
  }

  private async validateChanges(edits: FileEdit[]): Promise<ValidationResult> {
    // Create validation task
    const validationTask: AgentTask = {
      id: uuidv4(),
      agentType: 'validation',
      description: 'Validate all changes',
      files: edits.map(e => e.filePath),
      priority: 'high',
    };

    // Run validation
    const result = await this.validationAgent.execute(validationTask);
    
    // Return validation results
    return {
      valid: result.status === 'success',
      errors: result.errors?.map(e => ({
        file: '',
        message: e,
        type: 'logic' as const,
      })) || [],
      warnings: result.warnings?.map(w => ({
        file: '',
        message: w,
        type: 'style',
      })) || [],
    };
  }

  private async applyChanges(changeSet: ChangeSet): Promise<void> {
    if (!changeSet.validation.valid && !this.config?.autoValidate) {
      throw new Error('Changes failed validation');
    }

    this.emit('apply:start', { changeSet });

    try {
      for (const fileEdit of changeSet.edits) {
        await this.applyFileEdit(fileEdit);
      }

      changeSet.applied = true;
      this.emit('apply:complete', { changeSet });
    } catch (error) {
      // Rollback on error
      if (changeSet.rollbackData) {
        await this.changeTracker.rollback(changeSet.rollbackData);
      }
      throw error;
    }
  }

  private async applyFileEdit(edit: FileEdit): Promise<void> {
    if (edit.isNewFile) {
      // Create new file
      await fs.writeFile(edit.filePath, this.combineEdits(edit.edits));
    } else {
      // Read existing file
      const content = await fs.readFile(edit.filePath, 'utf-8');
      let updated = content;

      // Apply edits
      for (const change of edit.edits) {
        updated = updated.replace(change.oldText, change.newText);
      }

      // Write updated file
      await fs.writeFile(edit.filePath, updated);
    }
  }

  private combineEdits(edits: Array<{ newText: string }>): string {
    return edits.map(e => e.newText).join('\n');
  }

  // Helper methods
  private async readPackageJson(): Promise<any> {
    try {
      const content = await fs.readFile('package.json', 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private detectProjectType(packageJson: any): 'react' | 'node' | 'fullstack' {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.react && deps.express) return 'fullstack';
    if (deps.react) return 'react';
    return 'node';
  }

  private async detectLanguages(): Promise<string[]> {
    const languages = new Set<string>();
    
    // Check for TypeScript
    try {
      await fs.access('tsconfig.json');
      languages.add('typescript');
    } catch {
      languages.add('javascript');
    }

    return Array.from(languages);
  }

  private detectFrameworks(packageJson: any): string[] {
    const frameworks: string[] = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.react) frameworks.push('react');
    if (deps.vue) frameworks.push('vue');
    if (deps.angular) frameworks.push('angular');
    if (deps.express) frameworks.push('express');
    if (deps.nestjs) frameworks.push('nestjs');
    if (deps.next) frameworks.push('nextjs');

    return frameworks;
  }

  private detectTestFramework(packageJson: any): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.jest) return 'jest';
    if (deps.mocha) return 'mocha';
    if (deps.vitest) return 'vitest';
    if (deps.cypress) return 'cypress';

    return undefined;
  }

  private async detectStyleGuide(): Promise<string | undefined> {
    try {
      await fs.access('.eslintrc.js');
      return 'eslint';
    } catch {
      try {
        await fs.access('.prettierrc');
        return 'prettier';
      } catch {
        return undefined;
      }
    }
  }

  private detectBuildSystem(packageJson: any): string | undefined {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.webpack) return 'webpack';
    if (deps.vite) return 'vite';
    if (deps.rollup) return 'rollup';
    if (deps.parcel) return 'parcel';

    return undefined;
  }

  private analyzeTaskComplexity(task: CodeEditTask): 'simple' | 'moderate' | 'complex' {
    const factors = {
      scopeSize: task.scope.length,
      hasConstraints: !!task.constraints,
      requiresTests: task.constraints?.updateTests !== false,
      requiresDocs: task.constraints?.updateDocs !== false,
      allowsBreaking: task.constraints?.allowBreakingChanges === true,
    };

    const score = 
      factors.scopeSize * 2 +
      (factors.hasConstraints ? 1 : 0) +
      (factors.requiresTests ? 2 : 0) +
      (factors.requiresDocs ? 1 : 0) +
      (factors.allowsBreaking ? 3 : 0);

    if (score <= 5) return 'simple';
    if (score <= 10) return 'moderate';
    return 'complex';
  }

  private groupFilesByComponent(files: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const file of files) {
      const component = this.extractComponentName(file);
      if (!groups.has(component)) {
        groups.set(component, []);
      }
      groups.get(component)!.push(file);
    }

    return groups;
  }

  private extractComponentName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    
    // Extract component name from file
    const match = fileName.match(/^([A-Z][a-zA-Z]*)/);
    if (match) return match[1];

    // Use directory name
    if (parts.length > 1) {
      return parts[parts.length - 2];
    }

    return 'General';
  }

  private async findTestFiles(sourceFiles: string[]): Promise<string[]> {
    const testFiles: string[] = [];

    for (const file of sourceFiles) {
      // Look for corresponding test files
      const testPatterns = [
        file.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
        file.replace(/\.(ts|js|tsx|jsx)$/, '.spec.$1'),
        file.replace(/src\//, 'test/'),
        file.replace(/src\//, '__tests__/'),
      ];

      for (const pattern of testPatterns) {
        try {
          await fs.access(pattern);
          testFiles.push(pattern);
          break;
        } catch {
          // File doesn't exist, try next pattern
        }
      }
    }

    return testFiles;
  }

  private shouldCreateTests(task: CodeEditTask): boolean {
    return task.constraints?.updateTests === true ||
           task.description.toLowerCase().includes('test');
  }

  private determineExecutionOrder(tasks: AgentTask[]): 'parallel' | 'sequential' | 'staged' {
    const hasDependencies = tasks.some(t => t.dependencies && t.dependencies.length > 0);
    const taskCount = tasks.length;

    if (!hasDependencies && taskCount <= 3) return 'parallel';
    if (taskCount > 10) return 'staged';
    return 'sequential';
  }

  private estimateDuration(tasks: AgentTask[]): number {
    const baseTime = 5000; // 5 seconds base
    const perTaskTime = {
      'file-analysis': 2000,
      'refactor': 5000,
      'test': 4000,
      'documentation': 3000,
      'style': 1000,
      'validation': 2000,
    };

    let total = baseTime;
    for (const task of tasks) {
      total += perTaskTime[task.agentType] || 3000;
    }

    return total;
  }

  private assessRiskLevel(
    task: CodeEditTask,
    files: string[]
  ): 'low' | 'medium' | 'high' {
    const riskFactors = {
      fileCount: files.length,
      hasCore: files.some(f => f.includes('core') || f.includes('lib')),
      hasConfig: files.some(f => f.includes('config')),
      allowsBreaking: task.constraints?.allowBreakingChanges === true,
      noTests: task.constraints?.updateTests === false,
    };

    let riskScore = 0;
    if (riskFactors.fileCount > 10) riskScore += 2;
    if (riskFactors.hasCore) riskScore += 3;
    if (riskFactors.hasConfig) riskScore += 2;
    if (riskFactors.allowsBreaking) riskScore += 3;
    if (riskFactors.noTests) riskScore += 2;

    if (riskScore <= 3) return 'low';
    if (riskScore <= 7) return 'medium';
    return 'high';
  }

  private async waitForDependencies(
    dependencies: string[],
    completed: Set<string>
  ): Promise<void> {
    const maxWait = 60000; // 60 seconds
    const checkInterval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const allCompleted = dependencies.every(dep => completed.has(dep));
      if (allCompleted) return;

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    throw new Error('Timeout waiting for dependencies');
  }
}