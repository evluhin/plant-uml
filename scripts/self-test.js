#!/usr/bin/env node

/**
 * Self-test script for PlantUML Confluence Cloud App
 * Runs end-to-end tests against deployed services
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Test configuration
const TEST_DIAGRAM = '@startuml\nAlice -> Bob: Hello World\nBob -> Alice: Hi there!\n@enduml';
const EXPECTED_SVG_CHECKSUM = 'a1b2c3d4e5f6'; // This would be calculated from actual test
const TEST_TIMEOUT = 30000; // 30 seconds

// Environment variables
const RENDERER_URL = process.env.RENDERER_URL;
const JWT_SECRET = process.env.RENDERER_JWT_SECRET || 'shared-renderer-secret-2024';
const ENVIRONMENT = process.env.CI_ENVIRONMENT_NAME || 'development';

async function createTestJWT() {
  const payload = {
    iss: 'plantuml-confluence',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    nonce: Math.random().toString(36).substring(2, 15)
  };
  
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

async function testRenderer(format = 'svg') {
  console.log(`🧪 Testing ${format.toUpperCase()} rendering...`);
  
  const token = await createTestJWT();
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${RENDERER_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        source: TEST_DIAGRAM,
        format: format,
        theme: 'default'
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Validate response structure
    if (!result.metrics || typeof result.metrics.renderMs !== 'number') {
      throw new Error('Invalid response structure: missing metrics');
    }
    
    // Validate content
    if (format === 'svg') {
      if (!result.svg || !result.svg.includes('<svg')) {
        throw new Error('Invalid SVG response');
      }
      
      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(result.svg).digest('hex').substring(0, 12);
      console.log(`   ✅ SVG rendered successfully (${duration}ms)`);
      console.log(`   📊 Render time: ${result.metrics.renderMs}ms`);
      console.log(`   🔍 SVG checksum: ${checksum}`);
      console.log(`   ❄️  Cold start: ${result.metrics.coldStart ? 'Yes' : 'No'}`);
      
      return { success: true, checksum, duration, metrics: result.metrics };
    } else {
      if (!result.pngBase64 || !result.pngBase64.match(/^[A-Za-z0-9+/]+=*$/)) {
        throw new Error('Invalid PNG base64 response');
      }
      
      console.log(`   ✅ PNG rendered successfully (${duration}ms)`);
      console.log(`   📊 Render time: ${result.metrics.renderMs}ms`);
      console.log(`   📏 PNG size: ${result.pngBase64.length} chars`);
      console.log(`   ❄️  Cold start: ${result.metrics.coldStart ? 'Yes' : 'No'}`);
      
      return { success: true, duration, metrics: result.metrics };
    }
    
  } catch (error) {
    console.log(`   ❌ ${format.toUpperCase()} test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAuthentication() {
  console.log('🔐 Testing authentication...');
  
  try {
    // Test without token
    const noTokenResponse = await fetch(`${RENDERER_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: TEST_DIAGRAM, format: 'svg' })
    });
    
    if (noTokenResponse.status !== 401) {
      throw new Error(`Expected 401, got ${noTokenResponse.status}`);
    }
    
    // Test with invalid token
    const invalidTokenResponse = await fetch(`${RENDERER_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({ source: TEST_DIAGRAM, format: 'svg' })
    });
    
    if (invalidTokenResponse.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${invalidTokenResponse.status}`);
    }
    
    console.log('   ✅ Authentication working correctly');
    return { success: true };
    
  } catch (error) {
    console.log(`   ❌ Authentication test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runSelfTest() {
  console.log('🚀 Starting PlantUML Self-Test');
  console.log(`📍 Environment: ${ENVIRONMENT}`);
  console.log(`🔗 Renderer URL: ${RENDERER_URL}`);
  console.log(`⏰ Timeout: ${TEST_TIMEOUT}ms`);
  console.log('');
  
  if (!RENDERER_URL) {
    console.error('❌ RENDERER_URL not configured');
    process.exit(1);
  }
  
  const results = [];
  
  // Run tests
  results.push(await testAuthentication());
  results.push(await testRenderer('svg'));
  results.push(await testRenderer('png'));
  
  // Summary
  console.log('');
  console.log('📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 All tests passed! System is ready for production.');
    process.exit(0);
  } else {
    console.log('');
    console.log('💥 Some tests failed. Please check the issues above.');
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  console.error('⏰ Self-test timed out');
  process.exit(1);
}, TEST_TIMEOUT);

// Run the test
runSelfTest().catch((error) => {
  console.error('💥 Self-test failed:', error);
  process.exit(1);
});