#!/usr/bin/env node
import * as readline from 'readline';
import { CodeEditOrchestrator } from './CodeEditOrchestrator';
import { CodeEditTask } from './types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise(resolve => rl.question(prompt, resolve));
};

async function interactive() {
  console.log('\n🤖 Multi-Agent Code Editor - Interactive Mode\n');

  // Get task description
  const description = await question('What would you like to refactor? ');
  
  // Get scope
  const scopeInput = await question('Which directories? (comma-separated, e.g., src/components,src/utils): ');
  const scope = scopeInput.split(',').map(s => s.trim());

  // Get options
  const updateTests = (await question('Update tests? (y/n): ')).toLowerCase() === 'y';
  const updateDocs = (await question('Update documentation? (y/n): ')).toLowerCase() === 'y';
  const dryRun = (await question('Dry run first? (y/n): ')).toLowerCase() === 'y';

  rl.close();

  // Create and execute task
  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: dryRun,
  });

  // Progress tracking
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`\n📍 ${phase.toUpperCase()}`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    console.log(`  ✓ ${task.agentType}: ${result.edits.length} changes`);
  });

  const task: CodeEditTask = {
    id: `interactive-${Date.now()}`,
    description,
    scope,
    constraints: {
      updateTests,
      updateDocs,
      preserveApi: true,
    },
  };

  console.log('\n🚀 Starting task...\n');

  try {
    const result = await orchestrator.execute(task);
    
    console.log('\n✅ Task complete!');
    console.log(`  Files changed: ${result.edits.length}`);
    console.log(`  Validation: ${result.validation.valid ? 'Passed' : 'Failed'}`);

    if (dryRun && result.edits.length > 0) {
      const proceed = await question('\nApply these changes? (y/n): ');
      if (proceed.toLowerCase() === 'y') {
        // Re-run without dry run
        const finalOrchestrator = new CodeEditOrchestrator({
          maxConcurrentAgents: 10,
          enableDryRun: false,
        });
        await finalOrchestrator.execute(task);
        console.log('\n✅ Changes applied!');
      }
    }
  } catch (error) {
    console.error('\n❌ Task failed:', error);
  }

  process.exit(0);
}

interactive();