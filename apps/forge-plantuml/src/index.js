const api = require('@forge/api');
const jwt = require('jsonwebtoken');

exports.renderDiagram = async (req) => {
  console.log('renderDiagram called with:', JSON.stringify(req, null, 2));
  
  // If this is a macro resolver call (no source), return empty object
  const source = req.call?.payload?.source || req.payload?.source;
  if (!source) {
    console.log('Macro resolver call - returning empty object');
    return {};
  }
  
  if (!source.trim()) {
    console.log('Empty source provided');
    return { success: false, error: 'No PlantUML source provided' };
  }

  try {
    console.log('Rendering PlantUML source:', source.substring(0, 100) + '...');
    
    // Generate JWT token for authentication
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

    // Call AWS Lambda renderer
    const rendererUrl = process.env.RENDERER_URL || 'https://pb3hubgska.execute-api.eu-north-1.amazonaws.com/dev';
    console.log('Calling renderer at:', rendererUrl);
    
    const response = await api.fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        source: source,
        format: 'svg'
      })
    });

    console.log('Renderer response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Renderer error:', errorText);
      return { success: false, error: `Renderer failed: ${response.status} - ${errorText}` };
    }

    const result = await response.text();
    console.log('Renderer result length:', result.length);
    console.log('SVG content preview:', result.substring(0, 200));
    
    // For SVG, return as data URL with proper encoding
    const diagramUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result)}`;
    
    return { success: true, diagramUrl };
    
  } catch (error) {
    console.error('PlantUML render error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};