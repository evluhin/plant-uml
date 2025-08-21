import jwt from 'jsonwebtoken';
import { storage } from '@forge/api';

export interface JWTPayload {
  iss: string;
  iat: number;
  exp: number;
  nonce: string;
}

export async function generateJWT(): Promise<string> {
  const secret = await getJWTSecret();
  const now = Math.floor(Date.now() / 1000);
  
  const payload: JWTPayload = {
    iss: process.env.FORGE_APP_ID || 'plantuml-confluence',
    iat: now,
    exp: now + 60, // 60 seconds TTL
    nonce: Math.random().toString(36).substring(2, 15)
  };

  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

async function getJWTSecret(): Promise<string> {
  const stored = await storage.get('jwt-secret');
  if (stored) {
    return stored as string;
  }
  
  // Default shared renderer secret - in production, this should be configurable
  const defaultSecret = process.env.RENDERER_JWT_SECRET || 'shared-renderer-secret-2024';
  await storage.set('jwt-secret', defaultSecret);
  return defaultSecret;
}