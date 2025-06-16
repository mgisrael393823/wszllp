# Multi-Agent Code Editing System

A developer tool for orchestrating multiple specialized agents to make complex code changes in parallel, inspired by Anthropic's multi-agent architecture patterns.

## Overview

This system allows you to coordinate multiple specialized agents working on different aspects of a code change simultaneously:

- **CodeEditOrchestrator**: Analyzes tasks and delegates to specialized agents
- **FileAnalysisAgent**: Analyzes codebase structure and dependencies
- **RefactorAgent**: Handles code refactoring and restructuring
- **TestAgent**: Writes and updates tests
- **DocumentationAgent**: Updates documentation and comments
- **StyleAgent**: Ensures code style consistency
- **ValidationAgent**: Validates changes and checks for errors

## Architecture

```
Developer Request
      ↓
CodeEditOrchestrator
      ↓
Task Decomposition
      ↓
Parallel Agent Execution
    ├── FileAnalysisAgent (searches and analyzes)
    ├── RefactorAgent (makes code changes)
    ├── TestAgent (writes/updates tests)
    └── DocumentationAgent (updates docs)
      ↓
Change Validation
      ↓
Result Aggregation
```

## Usage

```typescript
const orchestrator = new CodeEditOrchestrator();

// Example: Refactor a component
await orchestrator.execute({
  task: "Refactor the UserProfile component to use the new design system",
  scope: ["src/components/UserProfile", "src/styles"],
  constraints: {
    preserveApi: true,
    updateTests: true,
    updateDocs: true
  }
});
```

## Key Features

1. **Parallel Execution**: Multiple agents work simultaneously on different files
2. **Dependency Awareness**: Understands code dependencies to avoid conflicts
3. **Atomic Changes**: All changes are validated before applying
4. **Rollback Support**: Can undo changes if validation fails
5. **Test Integration**: Automatically runs tests to verify changes
6. **Style Consistency**: Maintains project coding standards