const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.post('/mcp', async (req, res) => {
  const { messages } = req.body;

  // Simulate processing logic
  const input = messages.map(m => m.content).join(' ');
  const simulatedOutput = `✅ Legal review complete. Found 3 errors and 2 missing exhibits in: "${input.slice(0, 60)}..."`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const responseChunk = {
    choices: [
      {
        delta: {
          content: simulatedOutput
        },
        finish_reason: "stop"
      }
    ]
  };

  res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
  res.end();
});

app.listen(port, () => {
  console.log(`✅ WSZLLP MCP server running at http://localhost:${port}/mcp`);
});