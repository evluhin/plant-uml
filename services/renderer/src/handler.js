const { handler: renderHandler } = require('./handlers/render');
const { handler: healthHandler } = require('./handlers/health');

exports.render = async function(event) {
  const path = event.rawPath || event.requestContext.http.path;
  const method = event.requestContext.http.method;
  
  // Remove stage prefix if present
  const cleanPath = path.replace(/^\/[^/]+/, '') || path;
  
  if (cleanPath === '/health' && method === 'GET') {
    return healthHandler(event);
  }
  
  if (cleanPath === '/render' && method === 'POST') {
    return renderHandler(event);
  }
  
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not Found' })
  };
};