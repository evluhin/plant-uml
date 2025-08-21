import jwt from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { JWTPayload } from '../types';

const ssm = new SSMClient({});
let cachedSecret: string | null = null;

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = await getJWTSecret();
  
  try {
    const payload = jwt.verify(token, secret, { 
      algorithms: ['HS256'],
      maxAge: '60s'
    }) as JWTPayload;
    
    // Verify issuer matches expected app
    const expectedIssuer = process.env.EXPECTED_ISSUER || 'plantuml-confluence';
    if (payload.iss !== expectedIssuer) {
      throw new Error('Invalid issuer');
    }
    
    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getJWTSecret(): Promise<string> {
  if (cachedSecret) {
    return cachedSecret;
  }
  
  const paramName = process.env.JWT_SECRET_PARAM || '/plantuml/renderer/jwt-secret';
  
  try {
    const command = new GetParameterCommand({
      Name: paramName,
      WithDecryption: true
    });
    
    const result = await ssm.send(command);
    
    if (!result.Parameter?.Value) {
      throw new Error('JWT secret not found in SSM');
    }
    
    cachedSecret = result.Parameter.Value;
    return cachedSecret;
  } catch (error) {
    console.error('Failed to get JWT secret from SSM:', error);
    
    // Fallback for local development
    if (process.env.NODE_ENV === 'development' && process.env.LOCAL_JWT_SECRET) {
      return process.env.LOCAL_JWT_SECRET;
    }
    
    throw new Error('JWT secret not available');
  }
}