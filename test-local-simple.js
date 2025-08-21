#!/usr/bin/env node

// Simple test without SAM - just test the handler directly
const { handler } = require('./services/renderer/dist/handlers/render');

// Mock event
const mockEvent = {
  headers: {
    'authorization': 'Bearer test-token'
  },
  body: JSON.stringify({
    source: '@startuml\nAlice -> Bob: Hello\n@enduml',
    format: 'svg'
  })
};

// Mock environment
process.env.JWT_SECRET_PARAM = '/test/secret';
process.env.NODE_ENV = 'test';

console.log('🧪 Testing PlantUML handler directly...');

handler(mockEvent)
  .then(result => {
    console.log('✅ Handler executed');
    console.log('Status:', result.statusCode);
    console.log('Body preview:', result.body?.substring(0, 100) + '...');
    
    if (result.statusCode === 200) {
      console.log('✅ Success! PlantUML rendering works');
    } else {
      console.log('❌ Error:', result.body);
    }
  })
  .catch(error => {
    console.log('❌ Handler failed:', error.message);
    console.log('This is expected - we need PlantUML binaries and proper JWT setup');
    console.log('To test properly, use: sam local start-api');
  });