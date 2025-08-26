import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handler as renderHandler } from './handlers/render';
import { handler as healthHandler } from './handlers/health';

export async function render(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath || event.requestContext.http.path;
  
  if (path === '/health' && event.requestContext.http.method === 'GET') {
    return healthHandler(event);
  }
  
  if (path === '/render' && event.requestContext.http.method === 'POST') {
    return renderHandler(event);
  }
  
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not Found' })
  };
}