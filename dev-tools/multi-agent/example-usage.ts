import { CodeEditOrchestrator } from './CodeEditOrchestrator';
import { CodeEditTask } from './types';

// Example 1: Simple refactoring task
async function refactorComponentExample() {
  console.log('\n=== Example 1: Refactor Component to Use Hooks ===\n');

  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 5,
    enableDryRun: false, // Set to true to preview changes without applying
    autoValidate: true,
  });

  // Listen to events for progress tracking
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`📍 Starting phase: ${phase}`);
  });

  orchestrator.on('agent:start', ({ task }) => {
    console.log(`🤖 Agent ${task.agentType} starting: ${task.description}`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    console.log(`✅ Agent ${task.agentType} completed: ${result.status}`);
  });

  const task: CodeEditTask = {
    id: 'refactor-001',
    description: 'Convert UserProfile class component to functional component with hooks',
    scope: ['src/components/UserProfile'],
    constraints: {
      preserveApi: true,
      updateTests: true,
      updateDocs: true,
    },
  };

  try {
    const changeSet = await orchestrator.execute(task);
    
    console.log('\n📊 Results:');
    console.log(`- Files modified: ${changeSet.edits.length}`);
    console.log(`- Validation: ${changeSet.validation.valid ? 'Passed ✅' : 'Failed ❌'}`);
    
    if (changeSet.validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      changeSet.validation.errors.forEach(err => console.log(`  - ${err.message}`));
    }
  } catch (error) {
    console.error('Task failed:', error);
  }
}

// Example 2: Add feature with tests
async function addFeatureExample() {
  console.log('\n=== Example 2: Add New Feature with Tests ===\n');

  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 8,
    enableDryRun: true, // Preview mode
  });

  const task: CodeEditTask = {
    id: 'feature-001',
    description: 'Add dark mode toggle to the application settings',
    scope: ['src/components/Settings', 'src/context', 'src/styles'],
    constraints: {
      updateTests: true,
      allowBreakingChanges: false,
    },
  };

  try {
    const changeSet = await orchestrator.execute(task);
    
    console.log('\n📋 Planned Changes (Dry Run):');
    changeSet.edits.forEach(edit => {
      console.log(`\n📄 ${edit.filePath}:`);
      edit.edits.forEach(change => {
        console.log(`  - ${change.description || 'Change'}`);
      });
    });
  } catch (error) {
    console.error('Task failed:', error);
  }
}

// Example 3: Complex multi-file refactoring
async function complexRefactoringExample() {
  console.log('\n=== Example 3: Complex Multi-File Refactoring ===\n');

  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: false,
  });

  // Track metrics
  let startTime = Date.now();
  let agentMetrics: Record<string, number> = {};

  orchestrator.on('agent:complete', ({ task, result }) => {
    if (result.metrics) {
      agentMetrics[task.agentType] = result.metrics.duration;
    }
  });

  const task: CodeEditTask = {
    id: 'complex-001',
    description: 'Migrate from Redux to Context API for state management',
    scope: ['src/redux', 'src/components', 'src/hooks'],
    constraints: {
      preserveApi: false,
      updateTests: true,
      allowBreakingChanges: true,
      requiresReview: true,
    },
  };

  try {
    const changeSet = await orchestrator.execute(task);
    const duration = Date.now() - startTime;
    
    console.log('\n📊 Execution Summary:');
    console.log(`- Total duration: ${duration}ms`);
    console.log(`- Files analyzed: ${changeSet.edits.reduce((sum, e) => sum + 1, 0)}`);
    console.log(`- Risk level: ${changeSet.validation.errors.length > 0 ? 'High ⚠️' : 'Low ✅'}`);
    
    console.log('\n⏱️ Agent Performance:');
    Object.entries(agentMetrics).forEach(([agent, time]) => {
      console.log(`  - ${agent}: ${time}ms`);
    });

    // Save change history for review
    if (changeSet.rollbackData) {
      console.log('\n💾 Rollback data saved - changes can be reverted if needed');
    }
  } catch (error) {
    console.error('Task failed:', error);
  }
}

// Example 4: Parallel agents working on different components
async function parallelAgentsExample() {
  console.log('\n=== Example 4: Parallel Agents on Multiple Components ===\n');

  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 15,
    enableDryRun: false,
  });

  // Track parallel execution
  const agentTimings: Map<string, { start: number; end?: number }> = new Map();

  orchestrator.on('agent:start', ({ task }) => {
    agentTimings.set(task.id, { start: Date.now() });
  });

  orchestrator.on('agent:complete', ({ task }) => {
    const timing = agentTimings.get(task.id);
    if (timing) {
      timing.end = Date.now();
    }
  });

  const task: CodeEditTask = {
    id: 'parallel-001',
    description: 'Update all components to use new design system tokens',
    scope: [
      'src/components/Button',
      'src/components/Card',
      'src/components/Modal',
      'src/components/Form',
      'src/components/Table',
    ],
    constraints: {
      updateTests: false, // Skip tests for speed
      updateDocs: false,
    },
  };

  try {
    const changeSet = await orchestrator.execute(task);
    
    // Analyze parallel execution
    const parallelGroups = analyzeParallelExecution(agentTimings);
    
    console.log('\n🔄 Parallel Execution Analysis:');
    parallelGroups.forEach((group, index) => {
      console.log(`\nGroup ${index + 1} (executed in parallel):`);
      group.forEach(agent => console.log(`  - ${agent}`));
    });

    console.log(`\n✨ Total files updated: ${changeSet.edits.length}`);
  } catch (error) {
    console.error('Task failed:', error);
  }
}

// Helper function to analyze parallel execution
function analyzeParallelExecution(
  timings: Map<string, { start: number; end?: number }>
): string[][] {
  const groups: string[][] = [];
  const sorted = Array.from(timings.entries()).sort((a, b) => a[1].start - b[1].start);
  
  let currentGroup: string[] = [];
  let groupEnd = 0;

  for (const [id, timing] of sorted) {
    if (timing.start > groupEnd) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [id];
    } else {
      currentGroup.push(id);
    }
    groupEnd = Math.max(groupEnd, timing.end || timing.start);
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// Main execution
async function main() {
  console.log('🚀 Multi-Agent Code Editing System Examples\n');

  // Run examples
  await refactorComponentExample();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await addFeatureExample();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await complexRefactoringExample();
  await new Promise(resolve => setTimeout(resolve, 2000));

  await parallelAgentsExample();

  console.log('\n✅ All examples completed!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { refactorComponentExample, addFeatureExample, complexRefactoringExample, parallelAgentsExample };