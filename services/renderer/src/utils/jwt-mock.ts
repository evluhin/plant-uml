// Mock JWT verification for local development
export async function verifyJWTLocal(token: string): Promise<void> {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Skip JWT verification in development
    console.log('Mock JWT verification - development mode');
    return;
  }
  
  // In production, use real JWT verification
  const { verifyJWT } = await import('./jwt');
  await verifyJWT(token);
}