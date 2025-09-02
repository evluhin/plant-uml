const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RENDERER_URL = process.env.RENDERER_URL || 'https://pb3hubgska.execute-api.eu-north-1.amazonaws.com/dev';

async function debugLambda() {
  const source = `@startuml
Alice2 -> Bob3: Hello
Bob3 -> Alice2: Hi there
@enduml`;

  console.log('Testing source:', source);
  
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

    const result = await response.text();
    console.log('\n=== FULL SVG RESPONSE ===');
    console.log(result);
    console.log('\n=== END RESPONSE ===');
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

debugLambda().catch(console.error);
