const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dev-secret';

const source = `@startuml
Alice -> Bob: Hello
Bob -> Alice: Hi there
@enduml`;

const token = jwt.sign(
  {
    iss: 'plantuml-confluence',
    source: source,
    format: 'svg',
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
  },
  JWT_SECRET,
  { algorithm: 'HS256' }
);

console.log('JWT Token for Postman:');
console.log(token);
console.log('\nPostman Setup:');
console.log('URL: http://127.0.0.1:3001/render');
console.log('Method: POST');
console.log('Headers:');
console.log('  Content-Type: application/json');
console.log('  Authorization: Bearer ' + token);
console.log('\nBody (raw JSON):');
console.log(JSON.stringify({
  source: source,
  format: 'svg'
}, null, 2));