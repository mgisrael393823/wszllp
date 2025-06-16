#!/usr/bin/env node
import { CodeEditOrchestrator } from './CodeEditOrchestrator';
import { CodeEditTask } from './types';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: args.includes('--dry-run'),
    autoValidate: true,
  });

  // Add event listeners for progress
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`\n📍 Phase: ${phase}`);
  });

  orchestrator.on('agent:start', ({ task }) => {
    console.log(`  🤖 ${task.agentType}: ${task.description}`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} ${task.agentType}: ${result.status} (${result.edits.length} edits)`);
  });

  // Example tasks based on command
  let task: CodeEditTask;

  switch (command) {
    case 'refactor-hooks':
      task = {
        id: 'refactor-hooks-task',
        description: 'Convert class components to functional components with hooks',
        scope: ['src/components'],
        constraints: {
          preserveApi: true,
          updateTests: true,
          updateDocs: true,
        },
      };
      break;

    case 'add-feature':
      task = {
        id: 'add-feature-task',
        description: args[1] || 'Add new feature',
        scope: args.slice(2).length > 0 ? args.slice(2) : ['src'],
        constraints: {
          updateTests: true,
          updateDocs: true,
        },
      };
      break;

    case 'update-imports':
      task = {
        id: 'update-imports-task',
        description: 'Clean up and organize imports',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'add-tests':
      task = {
        id: 'add-tests-task',
        description: 'Add missing test files',
        scope: args.slice(1).length > 0 ? args.slice(1) : ['src/components'],
        constraints: {
          updateTests: true,
          updateDocs: false,
        },
      };
      break;

    default:
      console.log(`
Multi-Agent Code Editor

Usage:
  npm run agent <command> [options]

Commands:
  refactor-hooks             Convert class components to hooks
  add-feature <desc> <dirs>  Add a new feature
  update-imports             Clean up imports
  add-tests [dirs]           Add missing tests

Options:
  --dry-run                  Preview changes without applying

Examples:
  npm run agent refactor-hooks --dry-run
  npm run agent add-feature "Add dark mode" src/components src/styles
  npm run agent add-tests src/utils
      `);
      process.exit(0);
  }

  try {
    console.log('\n🚀 Starting Multi-Agent Task');
    console.log(`📋 Task: ${task.description}`);
    console.log(`📁 Scope: ${task.scope.join(', ')}`);
    console.log(`🔧 Mode: ${args.includes('--dry-run') ? 'Dry Run' : 'Live'}\n`);

    const changeSet = await orchestrator.execute(task);

    console.log('\n📊 Summary:');
    console.log(`  Files modified: ${changeSet.edits.length}`);
    console.log(`  Validation: ${changeSet.validation.valid ? '✅ Passed' : '❌ Failed'}`);
    
    if (args.includes('--dry-run')) {
      console.log('\n📝 Planned Changes:');
      changeSet.edits.forEach(edit => {
        console.log(`\n  📄 ${edit.filePath}:`);
        edit.edits.slice(0, 3).forEach(change => {
          console.log(`    - ${change.description || 'Modify code'}`);
        });
        if (edit.edits.length > 3) {
          console.log(`    ... and ${edit.edits.length - 3} more changes`);
        }
      });
    }

    if (changeSet.validation.errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      changeSet.validation.errors.forEach(err => {
        console.log(`  - ${err.file || 'General'}: ${err.message}`);
      });
    }

    if (changeSet.validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      changeSet.validation.warnings.forEach(warn => {
        console.log(`  - ${warn.file || 'General'}: ${warn.message}`);
      });
    }

    if (!args.includes('--dry-run') && changeSet.applied) {
      console.log('\n✅ Changes applied successfully!');
    }

  } catch (error) {
    console.error('\n❌ Task failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);