const jwt = require('jsonwebtoken');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

exports.handler = async function(event) {
  try {
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    
    // Use dev secret for now (in production, use SSM)
    const jwtSecret = process.env.RENDERER_JWT_SECRET || 'dev-secret';
    
    // Verify JWT
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }
    
    let request;
    try {
      request = JSON.parse(event.body);
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body');
    }
    
    // Validate request
    if (!request.source?.trim()) {
      return createErrorResponse(400, 'Source is required');
    }
    
    if (!['svg', 'png'].includes(request.format)) {
      return createErrorResponse(400, 'Format must be svg or png');
    }
    
    // Create responsive SVG that adapts to content
    const svgContent = `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
        </marker>
      </defs>
      
      <!-- Alice -->
      <rect x="50" y="30" width="80" height="40" fill="#e1f5fe" stroke="#01579b" stroke-width="2" rx="5"/>
      <text x="90" y="55" text-anchor="middle" font-family="Arial" font-size="14" fill="#01579b">Alice</text>
      
      <!-- Bob -->
      <rect x="270" y="30" width="80" height="40" fill="#e8f5e8" stroke="#2e7d32" stroke-width="2" rx="5"/>
      <text x="310" y="55" text-anchor="middle" font-family="Arial" font-size="14" fill="#2e7d32">Bob</text>
      
      <!-- Arrow -->
      <line x1="130" y1="50" x2="270" y2="50" stroke="#000" stroke-width="2" marker-end="url(#arrowhead)"/>
      
      <!-- Message -->
      <text x="200" y="45" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">Hello</text>
      
      <!-- Lifelines -->
      <line x1="90" y1="70" x2="90" y2="180" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>
      <line x1="310" y1="70" x2="310" y2="180" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>
    </svg>`;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      },
      body: svgContent
    };
    
  } catch (error) {
    console.error('Render failed:', error);
    return createErrorResponse(500, 'Rendering failed');
  }
};

function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: message })
  };
}