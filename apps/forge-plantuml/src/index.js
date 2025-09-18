// PlantUML Confluence App - Main Handler
// Final CI/CD deployment test - both AWS and Forge!
const api = require('@forge/api');
const jwt = require('jsonwebtoken');
const { storage } = require('@forge/api');
const crypto = require('crypto');

const CACHE_VERSION = 'v3';

const isValidDiagram = (data, format) => {
  if (format === 'png') {
    // PNG should be base64 encoded binary data
    return data && data.length > 1000; // minimum size for real PNG
  } else {
    // SVG validation
    return (
      data &&
      data.includes('<svg') &&
      data.includes('</svg>') &&
      !data.includes('Simple Box') && // fallback detection
      data.length > 500
    ); // minimum size for real diagram
  }
};

exports.renderDiagram = async (req) => {
  const source = req.call?.payload?.source || req.payload?.source;
  const resetCache = req.call?.payload?.resetCache || req.payload?.resetCache;

  if (!source?.trim()) {
    return { success: false, error: 'No PlantUML source provided' };
  }

  try {
    // Generate hash for caching with version
    const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
    const cacheKey = `${CACHE_VERSION}_diagram_${sourceHash}`;

    // Clear cache if resetCache flag is set
    if (resetCache) {
      await storage.delete(cacheKey);
    }

    // Check cache first (unless reset was requested)
    if (!resetCache) {
      const cached = await storage.get(cacheKey);
      if (cached) {
        return {
          success: true,
          diagramUrl: cached.diagramUrl,
          timestamp: cached.timestamp,
          cached: true,
        };
      }
    }

    // Generate JWT token
    const jwtSecret = process.env.RENDERER_JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      {
        iss: 'plantuml-confluence',
        source: source,
        format: 'svg',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );

    // Call renderer
    const rendererUrl =
      process.env.RENDERER_URL || 'https://q2cro7gz51.execute-api.eu-north-1.amazonaws.com/dev';

    const response = await api.fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ source, format: 'svg' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda error response:', errorText);
      return { success: false, error: `Renderer failed: ${response.status} - ${errorText}` };
    }

    const result = await response.text();

    // Validate diagram before caching
    if (!isValidDiagram(result, 'svg')) {
      return { success: false, error: 'Invalid diagram generated' };
    }

    const timestamp = Date.now();
    const diagramUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result)}`;

    // Cache only valid results
    await storage.set(cacheKey, { diagramUrl, timestamp });

    return { success: true, diagramUrl, timestamp };
  } catch (error) {
    console.error('PlantUML render error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

exports.refreshDiagram = async (req) => {
  const source = req.call?.payload?.source || req.payload?.source;

  if (!source?.trim()) {
    return { success: false, error: 'No source provided' };
  }

  try {
    // Delete from cache
    const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
    const cacheKey = `${CACHE_VERSION}_diagram_${sourceHash}`;
    await storage.delete(cacheKey);

    // Render fresh
    return await exports.renderDiagram(req);
  } catch (error) {
    console.error('Refresh diagram error:', error);
    return { success: false, error: error.message };
  }
};
