const jwt = require('jsonwebtoken');

exports.handler = async function(event) {
  try {
    console.log('=== Render Handler Called ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Verify JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse(401, 'Missing or invalid authorization header');
    }
    
    const token = authHeader.substring(7);
    console.log('Token received:', token.substring(0, 50) + '...');
    
    // Use dev secret
    const jwtSecret = process.env.RENDERER_JWT_SECRET || 'dev-secret';
    console.log('Using JWT secret:', jwtSecret);
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      console.log('JWT decoded successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return createErrorResponse(401, 'Invalid JWT token: ' + jwtError.message);
    }
    
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }
    
    let request;
    try {
      request = JSON.parse(event.body);
      console.log('Request parsed:', request);
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
    
    console.log('Generating test SVG for source:', request.source.substring(0, 50));
    
    // Generate a simple SVG based on the source content
    const svgContent = generateTestSvg(request.source);
    
    console.log('SVG generated, length:', svgContent.length);
    
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
    return createErrorResponse(500, 'Rendering failed: ' + error.message);
  }
};

function generateTestSvg(source) {
  // Extract participants from PlantUML source
  const lines = source.split('\n');
  const participants = new Set();
  const interactions = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.includes('->')) {
      const parts = trimmed.split('->');
      if (parts.length >= 2) {
        const from = parts[0].trim();
        const rest = parts[1].trim();
        const colonIndex = rest.indexOf(':');
        const to = colonIndex > 0 ? rest.substring(0, colonIndex).trim() : rest.trim();
        const message = colonIndex > 0 ? rest.substring(colonIndex + 1).trim() : 'Message';
        
        participants.add(from);
        participants.add(to);
        interactions.push({ from, to, message });
      }
    }
  });
  
  const participantList = Array.from(participants);
  const width = Math.max(400, participantList.length * 150);
  const height = 200 + interactions.length * 50;
  
  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
      </marker>
    </defs>`;
  
  // Draw participants
  participantList.forEach((participant, i) => {
    const x = 50 + i * 150;
    const y = 30;
    svg += `
    <rect x="${x}" y="${y}" width="100" height="40" fill="#e1f5fe" stroke="#01579b" stroke-width="2" rx="5"/>
    <text x="${x + 50}" y="${y + 25}" text-anchor="middle" font-family="Arial" font-size="14" fill="#01579b">${participant}</text>
    <line x1="${x + 50}" y1="${y + 40}" x2="${x + 50}" y2="${height - 20}" stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>`;
  });
  
  // Draw interactions
  interactions.forEach((interaction, i) => {
    const fromIndex = participantList.indexOf(interaction.from);
    const toIndex = participantList.indexOf(interaction.to);
    if (fromIndex >= 0 && toIndex >= 0) {
      const fromX = 50 + fromIndex * 150 + 50;
      const toX = 50 + toIndex * 150 + 50;
      const y = 100 + i * 50;
      
      svg += `
      <line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" stroke="#000" stroke-width="2" marker-end="url(#arrowhead)"/>
      <text x="${(fromX + toX) / 2}" y="${y - 5}" text-anchor="middle" font-family="Arial" font-size="12" fill="#000">${interaction.message}</text>`;
    }
  });
  
  svg += '</svg>';
  return svg;
}

function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: message })
  };
}