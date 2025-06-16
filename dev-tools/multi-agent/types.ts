import { Edit } from '../../src/services/agents/core/AgentTypes';

export interface CodeEditTask {
  id: string;
  description: string;
  scope: string[];
  constraints?: EditConstraints;
  context?: Record<string, any>;
}

export interface EditConstraints {
  preserveApi?: boolean;
  updateTests?: boolean;
  updateDocs?: boolean;
  maxFiles?: number;
  allowBreakingChanges?: boolean;
  requiresReview?: boolean;
}

export interface AgentTask {
  id: string;
  agentType: AgentType;
  description: string;
  files: string[];
  dependencies?: string[];
  priority: 'low' | 'medium' | 'high';
  constraints?: EditConstraints;
}

export type AgentType = 
  | 'file-analysis'
  | 'refactor'
  | 'test'
  | 'documentation'
  | 'style'
  | 'validation'
  | 'design-analysis'
  | 'theme-extraction'
  | 'design-system'
  | 'ui-modernization'
  | 'design-review'
  | 'design-implementation';

export interface FileEdit {
  file: string;
  additions: Array<{
    line: number;
    content: string;
  }>;
  deletions: Array<{
    line: number;
    count: number;
  }>;
  filePath?: string; // For backwards compatibility
  edits?: Array<{
    oldText: string;
    newText: string;
    description?: string;
  }>;
  isNewFile?: boolean;
}

export interface AgentResult {
  agentId: string;
  agentType: AgentType;
  status: 'success' | 'failed' | 'partial';
  edits: FileEdit[];
  analysis?: any;
  errors?: string[];
  warnings?: string[];
  metrics?: {
    filesAnalyzed: number;
    filesModified: number;
    linesAdded: number;
    linesRemoved: number;
    duration: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
    failures?: Array<{
      test: string;
      error: string;
    }>;
  };
}

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
  type: 'syntax' | 'type' | 'logic' | 'style' | 'test';
}

export interface ValidationWarning {
  file: string;
  line?: number;
  message: string;
  type: string;
}

export interface CodebaseContext {
  projectType: 'react' | 'node' | 'fullstack';
  languages: string[];
  frameworks: string[];
  testFramework?: string;
  styleGuide?: string;
  buildSystem?: string;
  dependencies: Record<string, string>;
}

export interface EditPlan {
  tasks: AgentTask[];
  executionOrder: 'parallel' | 'sequential' | 'staged';
  estimatedDuration: number;
  affectedFiles: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ChangeSet {
  id: string;
  description: string;
  edits: FileEdit[];
  validation: ValidationResult;
  rollbackData?: RollbackData;
  applied: boolean;
  timestamp: Date;
}

export interface RollbackData {
  originalContents: Map<string, string>;
  deletedFiles: string[];
}