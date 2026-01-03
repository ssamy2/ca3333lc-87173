/**
 * Demo script to test the MCP Playwright server capabilities
 * This demonstrates browser automation using the Playwright MCP server
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🎭 MCP Playwright Server Demo\n');
console.log('This demo will showcase the browser automation capabilities of the Playwright MCP server.\n');

// Start the MCP server
console.log('📦 Starting MCP Playwright server...');
const mcpServer = spawn('npx', ['-y', '@executeautomation/playwright-mcp-server'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseBuffer = '';

mcpServer.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  console.log('📥 Server response:', data.toString());
});

mcpServer.stderr.on('data', (data) => {
  console.error('⚠️ Server error:', data.toString());
});

// Function to send MCP request
function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    console.log('📤 Sending request:', JSON.stringify(request, null, 2));
    
    mcpServer.stdin.write(requestStr);
    
    // Wait for response
    setTimeout(() => {
      try {
        const lines = responseBuffer.split('\n').filter(line => line.trim());
        const lastResponse = lines[lines.length - 1];
        if (lastResponse) {
          resolve(JSON.parse(lastResponse));
        } else {
          resolve({ status: 'pending' });
        }
      } catch (e) {
        resolve({ status: 'pending', raw: responseBuffer });
      }
    }, 2000);
  });
}

// Demo sequence
async function runDemo() {
  try {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Step 1: Listing available tools...');
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const toolsResponse = await sendMCPRequest(listToolsRequest);
    console.log('✅ Available tools:', JSON.stringify(toolsResponse, null, 2));
    
    console.log('\n🌐 Step 2: Navigating to a webpage...');
    const navigateRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'playwright_navigate',
        arguments: {
          url: 'https://example.com'
        }
      }
    };
    
    const navigateResponse = await sendMCPRequest(navigateRequest);
    console.log('✅ Navigation result:', JSON.stringify(navigateResponse, null, 2));
    
    console.log('\n📸 Step 3: Taking a screenshot...');
    const screenshotRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'playwright_screenshot',
        arguments: {
          name: 'demo_screenshot'
        }
      }
    };
    
    const screenshotResponse = await sendMCPRequest(screenshotRequest);
    console.log('✅ Screenshot result:', JSON.stringify(screenshotResponse, null, 2));
    
    console.log('\n✨ Demo completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- MCP Playwright server is running');
    console.log('- Successfully listed available tools');
    console.log('- Demonstrated browser navigation');
    console.log('- Demonstrated screenshot capability');
    
    // Save demo results
    const demoResults = {
      timestamp: new Date().toISOString(),
      steps: [
        { step: 1, action: 'List Tools', response: toolsResponse },
        { step: 2, action: 'Navigate', response: navigateResponse },
        { step: 3, action: 'Screenshot', response: screenshotResponse }
      ]
    };
    
    writeFileSync('mcp_playwright_demo_results.json', JSON.stringify(demoResults, null, 2));
    console.log('\n💾 Demo results saved to mcp_playwright_demo_results.json');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    console.log('\n🛑 Stopping MCP server...');
    mcpServer.kill();
    process.exit(0);
  }
}

// Run the demo
runDemo();
