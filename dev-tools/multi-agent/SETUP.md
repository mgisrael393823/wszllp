# Multi-Agent Code Editor Setup Guide

## Installation

```bash
cd dev-tools/multi-agent
npm install
```

## Configuration

### 1. LLM Provider Setup

To enable intelligent refactoring and test generation, configure an LLM provider:

```typescript
import { CodeEditOrchestrator } from './CodeEditOrchestrator';
import { OpenAI } from 'openai'; // or your preferred LLM

const llmProvider = {
  complete: async (params: { prompt: string; maxTokens: number; temperature: number }) => {
    // Implement your LLM call here
    const response = await openai.completions.create({
      model: "gpt-4",
      prompt: params.prompt,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
    });
    return { text: response.choices[0].text };
  }
};

const orchestrator = new CodeEditOrchestrator({
  llmProvider,
  maxConcurrentAgents: 10,
});
```

### 2. Tool Requirements

The system works best when these tools are available in your project:

- **ESLint**: For linting and auto-fixing
- **Prettier**: For code formatting
- **TypeScript**: For type checking (if using TS)
- **Jest/Vitest**: For running tests

## Usage Examples

### Basic Refactoring

```typescript
import { CodeEditOrchestrator } from './dev-tools/multi-agent/CodeEditOrchestrator';

const orchestrator = new CodeEditOrchestrator();

await orchestrator.execute({
  id: 'task-1',
  description: 'Convert callbacks to async/await',
  scope: ['src/api'],
  constraints: {
    preserveApi: true,
    updateTests: true,
  }
});
```

### Dry Run Mode

Test changes without applying them:

```typescript
const orchestrator = new CodeEditOrchestrator({
  enableDryRun: true
});

const result = await orchestrator.execute({
  id: 'task-2',
  description: 'Refactor to use new component library',
  scope: ['src/components']
});

// Review planned changes
console.log(result.edits);
```

### Event Monitoring

Track progress in real-time:

```typescript
orchestrator.on('phase:start', ({ phase }) => {
  console.log(`Starting ${phase}...`);
});

orchestrator.on('agent:complete', ({ task, result }) => {
  console.log(`${task.agentType} completed with ${result.edits.length} changes`);
});

orchestrator.on('task:error', ({ error }) => {
  console.error('Task failed:', error);
});
```

## Agent Types

### FileAnalysisAgent
- Analyzes code structure
- Finds dependencies
- Identifies components, functions, classes
- No code modifications

### RefactorAgent
- Makes code structure changes
- Converts patterns (class to functional, etc.)
- Updates imports/exports
- Requires LLM for best results

### TestAgent
- Generates new tests
- Updates existing tests
- Follows project test patterns
- Works with Jest, Vitest, etc.

### DocumentationAgent
- Adds JSDoc comments
- Updates inline documentation
- Creates/updates README files
- Maintains changelogs

### StyleAgent
- Applies code formatting
- Runs Prettier/ESLint
- Ensures consistent style
- Reports style issues

### ValidationAgent
- Runs syntax checks
- TypeScript validation
- Executes test suite
- Ensures changes don't break build

## Best Practices

1. **Start with Small Scopes**: Test on individual components before large refactors
2. **Use Dry Run**: Always preview changes for complex tasks
3. **Enable Checkpointing**: For long-running tasks that might fail
4. **Monitor Events**: Track progress and catch issues early
5. **Review Validation**: Check all validation errors before applying

## Troubleshooting

### Common Issues

1. **"No formatter available"**
   - Install Prettier: `npm install -D prettier`
   - Install ESLint: `npm install -D eslint`

2. **"Tests failed"**
   - Ensure test command in package.json
   - Check test files exist
   - Run tests manually first

3. **"TypeScript validation failed"**
   - Install TypeScript: `npm install -D typescript`
   - Ensure tsconfig.json exists
   - Fix existing TS errors first

4. **"Too many files"**
   - Reduce scope array
   - Increase maxConcurrentAgents
   - Use more specific file patterns

## Advanced Configuration

### Custom Agents

Create your own specialized agent:

```typescript
class CustomAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    // Your implementation
  }
}

// Register with orchestrator
orchestrator.registerAgent('custom', new CustomAgent());
```

### Parallel Execution Tuning

```typescript
const orchestrator = new CodeEditOrchestrator({
  maxConcurrentAgents: 15, // Increase for more parallelism
  agentTimeouts: {
    'file-analysis': 30000,
    'refactor': 60000,
    'test': 120000,
  }
});
```

## Integration with CI/CD

Use in automated workflows:

```yaml
# .github/workflows/refactor.yml
- name: Run Multi-Agent Refactor
  run: |
    npx ts-node ./scripts/refactor-task.ts
    
- name: Validate Changes
  run: |
    npm test
    npm run lint
    npm run type-check
```