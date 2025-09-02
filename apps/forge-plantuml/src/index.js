const api = require('@forge/api');
const jwt = require('jsonwebtoken');
const { storage } = require('@forge/api');
const crypto = require('crypto');

exports.renderDiagram = async (req) => {
  console.log('=== renderDiagram called ===');
  console.log('Full request:', JSON.stringify(req, null, 2));
  
  const source = req.call?.payload?.source || req.payload?.source;
  console.log('Extracted source:', source);
  
  if (!source) {
    console.log('No source found, returning empty object');
    return {};
  }
  
  if (!source.trim()) {
    console.log('Empty source provided');
    return { success: false, error: 'No PlantUML source provided' };
  }

  try {
    // Generate hash for caching
    const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
    const cacheKey = `diagram_${sourceHash}`;
    
    // Check cache first
    const cached = await storage.get(cacheKey);
    if (cached) {
      console.log('Returning cached diagram for hash:', sourceHash.substring(0, 8));
      return { success: true, diagramUrl: cached.diagramUrl, timestamp: cached.timestamp, cached: true };
    }
    
    console.log('Rendering new diagram for hash:', sourceHash.substring(0, 8));
    
    // Generate JWT token
    const jwtSecret = process.env.RENDERER_JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      {
        iss: 'plantuml-confluence',
        source: source,
        format: 'svg',
        exp: Math.floor(Date.now() / 1000) + 60
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );

    // Call renderer
    const rendererUrl = process.env.RENDERER_URL || 'https://pb3hubgska.execute-api.eu-north-1.amazonaws.com/dev';
    console.log('Calling Lambda at:', rendererUrl);
    
    const response = await api.fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ source, format: 'svg' })
    });

    console.log('Lambda response status:', response.status);
    console.log('Lambda response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda error response:', errorText);
      return { success: false, error: `Renderer failed: ${response.status} - ${errorText}` };
    }

    const result = await response.text();
    console.log('Lambda response length:', result.length);
    console.log('Lambda response preview:', result.substring(0, 200));
    const timestamp = Date.now();
    const diagramUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result)}`;
    
    // Cache the result
    await storage.set(cacheKey, { diagramUrl, timestamp });
    console.log('Cached diagram with hash:', sourceHash.substring(0, 8));
    
    return { success: true, diagramUrl, timestamp };
    
  } catch (error) {
    console.error('PlantUML render error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};