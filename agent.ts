#!/usr/bin/env node
import * as readline from 'readline';
import { CodeEditOrchestrator, CodeEditTask } from './dev-tools/multi-agent/index';

// Interactive agent that accepts custom prompts like Claude
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise(resolve => rl.question(prompt, resolve));
};

async function main() {
  console.log(`
🤖 WSZLLP Multi-Agent Assistant
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I can help you refactor your codebase. Just tell me what you want to do!

Examples:
- "Add error handling to all API calls"
- "Convert the UserProfile component to use hooks"
- "Add loading states to all components that fetch data"
- "Refactor the authentication flow to use context instead of props"
- "Add TypeScript types to the services folder"

Type 'exit' to quit, 'help' for more examples.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  while (true) {
    const input = await question('\n🤖 What would you like me to do? ');
    
    if (input.toLowerCase() === 'exit') {
      break;
    }

    if (input.toLowerCase() === 'help') {
      showHelp();
      continue;
    }

    if (!input.trim()) {
      continue;
    }

    // Parse the natural language request
    const task = await parseRequest(input);
    
    if (!task) {
      console.log('\n❓ I didn\'t understand that. Can you be more specific?');
      continue;
    }

    // Ask for confirmation
    console.log('\n📋 Here\'s what I\'ll do:');
    console.log(`   Task: ${task.description}`);
    console.log(`   Scope: ${task.scope.join(', ')}`);
    console.log(`   Update tests: ${task.constraints?.updateTests ? 'Yes' : 'No'}`);
    console.log(`   Update docs: ${task.constraints?.updateDocs ? 'Yes' : 'No'}`);
    
    const confirm = await question('\n➡️  Proceed? (y/n/dry-run): ');
    
    if (confirm.toLowerCase() === 'n') {
      console.log('Cancelled.');
      continue;
    }

    const dryRun = confirm.toLowerCase() === 'dry-run' || confirm.toLowerCase() === 'd';
    
    // Execute the task
    await executeTask(task, dryRun);
  }

  rl.close();
  console.log('\n👋 Goodbye!');
}

async function parseRequest(input: string): Promise<CodeEditTask | null> {
  const lower = input.toLowerCase();
  
  // Determine scope based on the request
  let scope: string[] = [];
  let description = input;
  let updateTests = false;
  let updateDocs = false;
  let preserveApi = true;

  // Scope detection
  if (lower.includes('all') || lower.includes('entire') || lower.includes('whole')) {
    scope = ['src'];
  } else if (lower.includes('component')) {
    scope = ['src/components'];
    if (lower.match(/(\w+)\s+component/)) {
      const componentName = lower.match(/(\w+)\s+component/)![1];
      scope = [`src/components/${componentName.charAt(0).toUpperCase() + componentName.slice(1)}`];
    }
  } else if (lower.includes('service') || lower.includes('api')) {
    scope = ['src/services', 'src/api'];
  } else if (lower.includes('hook')) {
    scope = ['src/hooks'];
  } else if (lower.includes('context')) {
    scope = ['src/context'];
  } else if (lower.includes('util')) {
    scope = ['src/utils'];
  } else if (lower.includes('page')) {
    scope = ['src/pages'];
  } else if (lower.includes('style') || lower.includes('css')) {
    scope = ['src/styles', 'src/components'];
  } else {
    // Try to extract specific paths mentioned
    const pathMatches = input.match(/(?:in|to|from)\s+(\S+)/g);
    if (pathMatches) {
      scope = pathMatches.map(match => {
        const path = match.replace(/^(in|to|from)\s+/, '');
        return path.startsWith('src/') ? path : `src/${path}`;
      });
    } else {
      scope = ['src'];
    }
  }

  // Feature detection
  if (lower.includes('test')) {
    updateTests = true;
  }
  if (lower.includes('document') || lower.includes('jsdoc') || lower.includes('comment')) {
    updateDocs = true;
  }
  if (lower.includes('breaking') || lower.includes('migration')) {
    preserveApi = false;
  }

  // Ask for missing scope if needed
  if (scope.length === 0 || scope[0] === 'src') {
    const specificScope = await question('📁 Which folders should I look in? (comma-separated, or press Enter for all): ');
    if (specificScope.trim()) {
      scope = specificScope.split(',').map(s => {
        const trimmed = s.trim();
        return trimmed.startsWith('src/') ? trimmed : `src/${trimmed}`;
      });
    }
  }

  return {
    id: `custom-${Date.now()}`,
    description,
    scope,
    constraints: {
      updateTests,
      updateDocs,
      preserveApi,
      allowBreakingChanges: !preserveApi,
    },
  };
}

async function executeTask(task: CodeEditTask, dryRun: boolean) {
  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: dryRun,
    autoValidate: true,
  });

  // Progress tracking
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`\n📍 ${phase.charAt(0).toUpperCase() + phase.slice(1)}...`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    if (result.edits.length > 0) {
      console.log(`  ✓ ${task.agentType}: ${result.edits.length} changes`);
    }
  });

  try {
    console.log('\n🚀 Working on it...\n');
    const result = await orchestrator.execute(task);
    
    console.log('\n✅ Done!');
    console.log(`📊 Summary:`);
    console.log(`   Files changed: ${result.edits.length}`);
    console.log(`   Validation: ${result.validation.valid ? 'Passed ✅' : 'Failed ❌'}`);
    
    if (result.validation.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.validation.errors.forEach(err => {
        console.log(`   - ${err.message}`);
      });
    }

    if (dryRun) {
      console.log('\n🔍 This was a dry run. No changes were applied.');
      console.log('💡 Remove "dry-run" to apply the changes.');
    }
  } catch (error) {
    console.error('\n❌ Task failed:', error);
  }
}

function showHelp() {
  console.log(`
📚 EXAMPLES OF WHAT YOU CAN ASK:

COMPONENT REFACTORING:
- "Convert all class components to functional components"
- "Add hooks to the UserProfile component"
- "Refactor CaseList to use the new design system"

ERROR HANDLING:
- "Add error boundaries to all pages"
- "Add try-catch blocks to all async functions"
- "Improve error handling in the API calls"

PERFORMANCE:
- "Add React.memo to components that re-render frequently"
- "Optimize the Dashboard component"
- "Add lazy loading to heavy components"

CODE QUALITY:
- "Clean up unused imports"
- "Add TypeScript types to all functions"
- "Extract magic numbers to constants"
- "Add JSDoc comments to public APIs"

TESTING:
- "Add tests for the authentication flow"
- "Create tests for the CaseForm component"
- "Add missing test files"

STYLING:
- "Convert inline styles to CSS modules"
- "Update components to use Tailwind classes"
- "Remove deprecated CSS"

TIPS:
- Be specific about which components or folders
- Mention if you want tests or docs updated
- Say "dry-run" when confirming to preview changes
`);
}

main().catch(console.error);