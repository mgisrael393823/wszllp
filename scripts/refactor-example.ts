import { CodeEditOrchestrator } from '../dev-tools/multi-agent';

async function refactorComponents() {
  const orchestrator = new CodeEditOrchestrator({
    maxConcurrentAgents: 10,
    enableDryRun: false, // Set to true to preview
    autoValidate: true,
  });

  // Listen to progress
  orchestrator.on('phase:start', ({ phase }) => {
    console.log(`Starting ${phase}...`);
  });

  orchestrator.on('agent:complete', ({ task, result }) => {
    console.log(`${task.agentType} completed: ${result.status}`);
  });

  // Execute the refactoring
  const result = await orchestrator.execute({
    id: 'refactor-components',
    description: 'Convert old component patterns to modern React',
    scope: [
      'src/components/Cases',
      'src/components/Clients',
      'src/components/Dashboard'
    ],
    constraints: {
      preserveApi: true,
      updateTests: true,
      updateDocs: true,
    }
  });

  console.log('Refactoring complete!');
  console.log(`Modified ${result.edits.length} files`);
}

refactorComponents().catch(console.error);