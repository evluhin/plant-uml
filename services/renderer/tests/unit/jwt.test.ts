import jwt from 'jsonwebtoken';

describe('JWT utilities', () => {
  it('should create and verify JWT tokens', () => {
    const secret = 'test-secret-key';
    const payload = {
      iss: 'plantuml-confluence',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
      nonce: 'test-nonce'
    };

    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    const decoded = jwt.verify(token, secret) as any;
    
    expect(decoded.iss).toBe('plantuml-confluence');
    expect(decoded.nonce).toBe('test-nonce');
  });

  it('should reject expired JWT', () => {
    const secret = 'test-secret-key';
    const payload = {
      iss: 'plantuml-confluence',
      iat: Math.floor(Date.now() / 1000) - 120,
      exp: Math.floor(Date.now() / 1000) - 60,
      nonce: 'test-nonce'
    };

    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    
    expect(() => jwt.verify(token, secret)).toThrow();
  });

  it('should reject JWT with wrong secret', () => {
    const payload = {
      iss: 'plantuml-confluence',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
      nonce: 'test-nonce'
    };

    const token = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });
    
    expect(() => jwt.verify(token, 'test-secret-key')).toThrow();
  });

  it('should reject malformed JWT', () => {
    expect(() => jwt.verify('invalid-token', 'test-secret-key')).toThrow();
  });
});