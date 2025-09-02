const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = 'dev-secret'; // Same as in Lambda
const LOCAL_URL = 'http://127.0.0.1:3001';

async function testLocalLambda() {
  const source = `@startuml
Alice -> Bob: Hello
Bob -> Alice: Hi there
@enduml`;

  console.log('Testing PlantUML source:');
  console.log(source);
  console.log('\n=== Generating JWT Token ===');
  
  // Generate JWT token
  const token = jwt.sign(
    {
      iss: 'plantuml-confluence',
      source: source,
      format: 'svg',
      exp: Math.floor(Date.now() / 1000) + 60
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );

  console.log('JWT Token generated:', token.substring(0, 50) + '...');

  console.log('\n=== Testing Health Endpoint ===');
  try {
    const healthResponse = await fetch(`${LOCAL_URL}/health`);
    console.log('Health status:', healthResponse.status);
    const healthText = await healthResponse.text();
    console.log('Health response:', healthText);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }

  console.log('\n=== Testing Render Endpoint ===');
  try {
    const response = await fetch(`${LOCAL_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        source: source,
        format: 'svg'
      })
    });

    console.log('Render status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.text();
    console.log('Response length:', result.length);
    console.log('Response preview:', result.substring(0, 300) + '...');
    
    // Check if it's valid SVG
    if (result.includes('<svg')) {
      console.log('✅ Valid SVG response received');
    } else {
      console.log('❌ Invalid SVG response');
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

console.log('🚀 Testing Local Lambda Function');
console.log('Make sure SAM local is running on port 3001');
console.log('=====================================\n');

testLocalLambda().catch(console.error);