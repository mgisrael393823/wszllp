#!/usr/bin/env node
import 'dotenv/config';
import { CodeEditOrchestrator, type CodeEditTask } from './dev-tools/multi-agent';
import { AnthropicProvider } from './dev-tools/multi-agent/utils/AnthropicProvider';

// This file lets you run multi-agent refactoring from the project root
// Usage: npx ts-node refactor.ts <command> [options]

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Initialize LLM provider if API key is available
  let llmProvider;
  try {
    llmProvider = new AnthropicProvider();
  } catch (error) {
    console.log('⚠️  No Anthropic API key found. Some agents may have limited functionality.');
    console.log('   Set ANTHROPIC_API_KEY environment variable to enable AI-powered features.\n');
  }

  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: args.includes('--dry-run'),
    autoValidate: true,
    llmProvider,
  });

  // Progress tracking
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`\n📍 Phase: ${phase}`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    console.log(`  ${result.status === 'success' ? '✅' : '❌'} ${task.agentType}`);
  });

  let task: CodeEditTask;

  switch (command) {
    case 'modernize-components':
      task = {
        id: 'modernize-components',
        description: 'Update all class components to functional components with hooks',
        scope: ['src/components'],
        constraints: {
          preserveApi: true,
          updateTests: true,
          updateDocs: true,
        },
      };
      break;

    case 'fix-imports':
      task = {
        id: 'fix-imports',
        description: 'Fix and organize all imports in the project',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'add-types':
      task = {
        id: 'add-types',
        description: 'Add TypeScript types to untyped functions and components',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
          updateDocs: true,
        },
      };
      break;

    case 'update-supabase':
      task = {
        id: 'update-supabase',
        description: 'Update Supabase client usage to latest patterns',
        scope: ['src/lib', 'src/services', 'src/context'],
        constraints: {
          preserveApi: false,
          updateTests: true,
          allowBreakingChanges: true,
        },
      };
      break;

    case 'add-error-handling':
      task = {
        id: 'add-error-handling',
        description: 'Add comprehensive error handling and error boundaries',
        scope: ['src/components', 'src/services', 'src/api'],
        constraints: {
          preserveApi: true,
          updateTests: true,
          updateDocs: true,
        },
      };
      break;

    case 'optimize-performance':
      task = {
        id: 'optimize-performance',
        description: 'Add React.memo, useMemo, and useCallback for performance',
        scope: ['src/components'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'standardize-api-calls':
      task = {
        id: 'standardize-api-calls',
        description: 'Standardize all API calls to use consistent patterns',
        scope: ['src/services', 'src/api', 'src/utils/efile'],
        constraints: {
          preserveApi: false,
          updateTests: true,
          allowBreakingChanges: true,
        },
      };
      break;

    case 'add-loading-states':
      task = {
        id: 'add-loading-states',
        description: 'Add loading states and skeletons to all data-fetching components',
        scope: ['src/components', 'src/pages'],
        constraints: {
          preserveApi: true,
          updateTests: true,
        },
      };
      break;

    case 'migrate-to-tanstack-query':
      task = {
        id: 'migrate-to-tanstack-query',
        description: 'Replace custom data fetching with TanStack Query',
        scope: ['src/hooks', 'src/components', 'src/pages'],
        constraints: {
          preserveApi: false,
          updateTests: true,
          allowBreakingChanges: true,
        },
      };
      break;

    case 'add-accessibility':
      task = {
        id: 'add-accessibility',
        description: 'Add ARIA labels, roles, and keyboard navigation',
        scope: ['src/components'],
        constraints: {
          preserveApi: true,
          updateTests: true,
          updateDocs: true,
        },
      };
      break;

    case 'extract-constants':
      task = {
        id: 'extract-constants',
        description: 'Extract magic numbers and strings to constants',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'add-jsdoc':
      task = {
        id: 'add-jsdoc',
        description: 'Add JSDoc comments to all exported functions and components',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
          updateDocs: true,
        },
      };
      break;

    case 'cleanup-unused':
      task = {
        id: 'cleanup-unused',
        description: 'Remove unused imports, variables, and dead code',
        scope: ['src'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'migrate-css-modules':
      task = {
        id: 'migrate-css-modules',
        description: 'Convert global CSS to CSS modules',
        scope: ['src/components', 'src/styles'],
        constraints: {
          preserveApi: true,
          updateTests: false,
        },
      };
      break;

    case 'analyze-design':
      task = {
        id: 'analyze-design',
        description: 'Analyze current design patterns and create recommendations',
        scope: ['src/styles', 'src/components', 'src/pages'],
        constraints: {
          preserveApi: true,
          updateTests: false,
          updateDocs: false,
        },
      };
      break;

    case 'extract-theme':
      task = {
        id: 'extract-theme',
        description: 'Extract design tokens and create theme configuration',
        scope: ['src/styles', 'src/components'],
        constraints: {
          preserveApi: true,
          updateTests: false,
          updateDocs: true,
        },
      };
      break;

    case 'modernize-ui':
      task = {
        id: 'modernize-ui',
        description: 'Modernize UI with consistent design system',
        scope: ['src/styles', 'src/components', 'src/pages'],
        constraints: {
          preserveApi: true,
          updateTests: false,
          updateDocs: false,
        },
      };
      break;

    default:
      console.log(`
WSZLLP Multi-Agent Refactoring Tool

Usage:
  npm run refactor <command> [--dry-run]

MODERNIZATION COMMANDS:
  modernize-components      Convert class components to hooks
  migrate-to-tanstack-query Replace custom data fetching with TanStack Query
  migrate-css-modules       Convert global CSS to CSS modules
  update-supabase          Update to latest Supabase patterns

CODE QUALITY COMMANDS:
  fix-imports              Organize and clean up imports
  add-types                Add missing TypeScript types
  add-jsdoc                Add JSDoc comments to functions/components
  extract-constants        Extract magic numbers/strings to constants
  cleanup-unused           Remove unused imports and dead code

FEATURE ENHANCEMENT COMMANDS:
  add-error-handling       Add error boundaries and try-catch blocks
  add-loading-states       Add loading skeletons to data components
  add-accessibility        Add ARIA labels and keyboard navigation
  optimize-performance     Add React.memo, useMemo, useCallback

API/SERVICE COMMANDS:
  standardize-api-calls    Standardize API call patterns

DESIGN SYSTEM COMMANDS:
  analyze-design           Analyze current design patterns and create recommendations
  extract-theme            Extract design tokens and create theme configuration
  modernize-ui             Modernize UI with consistent design system

Options:
  --dry-run               Preview changes without applying

Examples:
  npm run refactor modernize-components --dry-run
  npm run refactor add-error-handling
  npm run refactor cleanup-unused --dry-run
`);
      process.exit(0);
  }

  try {
    console.log(`\n🚀 Starting: ${task.description}`);
    console.log(`📁 Scope: ${task.scope.join(', ')}`);

    const result = await orchestrator.execute(task);

    console.log(`\n📊 Results:`);
    console.log(`  Files modified: ${result.edits.length}`);
    console.log(`  Validation: ${result.validation.valid ? '✅ Passed' : '❌ Failed'}`);

    if (args.includes('--dry-run')) {
      console.log('\n🔍 Preview mode - no changes applied');
      console.log('Remove --dry-run to apply changes');
    }
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

main();