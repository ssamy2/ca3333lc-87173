// Test MCP Playwright Server
const { spawn } = require('child_process');

console.log('🎭 Testing MCP Playwright Server...\n');

// Start the MCP server
const mcpServer = spawn('npx', ['@executeautomation/playwright-mcp-server'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a test request to navigate
const testRequest = {
  jsonrpc: '2.0',
  method: 'tools/call',
  params: {
    name: 'playwright_navigate',
    arguments: {
      url: 'http://localhost:8081'
    }
  },
  id: 1
};

console.log('📤 Sending request:', JSON.stringify(testRequest, null, 2));

// Send the request
mcpServer.stdin.write(JSON.stringify(testRequest) + '\n');

// Handle responses
mcpServer.stdout.on('data', (data) => {
  console.log('📥 Response:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.error('❌ Error:', data.toString());
});

// Handle server exit
mcpServer.on('close', (code) => {
  console.log(`\n✅ MCP server exited with code ${code}`);
});

// Give it some time then close
setTimeout(() => {
  console.log('\n🛑 Closing MCP server...');
  mcpServer.kill();
}, 5000);
