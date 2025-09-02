const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RENDERER_URL = process.env.RENDERER_URL || 'https://pb3hubgska.execute-api.eu-north-1.amazonaws.com/dev';

async function testLambda(source, testName) {
  console.log(`\n=== Testing: ${testName} ===`);
  console.log('Source:', source);
  
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

  try {
    const response = await fetch(`${RENDERER_URL}/render`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, errorText);
      return;
    }

    const result = await response.text();
    console.log('Response length:', result.length);
    console.log('Response preview:', result.substring(0, 200) + '...');
    
    // Extract key parts to verify different diagrams
    const titleMatch = result.match(/<title[^>]*>([^<]*)<\/title>/);
    const pathMatch = result.match(/<path[^>]*d="([^"]{0,50})/);
    
    console.log('Title:', titleMatch ? titleMatch[1] : 'Not found');
    console.log('Path preview:', pathMatch ? pathMatch[1] : 'Not found');
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function runTests() {
  // Test 1: Original diagram
  await testLambda(`@startuml
Alice -> Bob: Hello
Bob -> Charlie: World
Charlie -> Alice: !
@enduml`, 'Original Diagram');

  // Test 2: Modified diagram
  await testLambda(`@startuml
Alice2 -> Bob3: Hello
Bob3 -> Alice2: Hi there
@enduml`, 'Modified Diagram');

  // Test 3: Different diagram
  await testLambda(`@startuml
User -> System: Login
System -> Database: Validate
Database -> System: OK
System -> User: Welcome
@enduml`, 'Different Diagram');
}

runTests().catch(console.error);
