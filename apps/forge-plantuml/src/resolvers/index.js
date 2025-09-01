const { storage } = require('@forge/api');
const { generateAttachmentHash, clampDimensions } = require('../utils/hash');
const { sanitizeSVG } = require('../utils/sanitize');

async function render(req) {
  const { source, format = 'svg', width, height, title, theme } = req.payload;
  
  if (!source || !source.trim()) {
    return {
      html: '<div style="padding: 16px; border: 1px solid #ccc; background: #f5f5f5;">No PlantUML source provided</div>'
    };
  }

  try {
    const hash = generateAttachmentHash(source, format, theme);
    
    // Check if attachment already exists
    const existingAttachment = await storage.get(`attachment:${hash}`);
    if (existingAttachment) {
      return renderExistingAttachment(existingAttachment, format, width, height, title);
    }
    
    // For demo purposes, return a placeholder
    const placeholder = format === 'svg' 
      ? '<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" fill="#f0f0f0" stroke="#ccc"/><text x="100" y="50" text-anchor="middle" dy=".3em">PlantUML Placeholder</text></svg>'
      : 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    await storage.set(`attachment:${hash}`, placeholder);
    
    if (format === 'svg') {
      const sanitizedSVG = sanitizeSVG(placeholder);
      return renderSVG(sanitizedSVG, width, height, title);
    } else {
      return renderPNG(placeholder, width, height, title);
    }
    
  } catch (error) {
    console.error('PlantUML render error:', error);
    return {
      html: `<div style="padding: 16px; border: 1px solid #ff6b6b; background: #ffe0e0; color: #d63031;">
        <strong>PlantUML Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
      </div>`
    };
  }
}

async function getAdminPage() {
  const currentUrl = await storage.get('renderer-url') || process.env.RENDERER_URL || 'https://api.plantuml-renderer.example.com';
  
  return {
    html: `
      <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h2>PlantUML Renderer Configuration</h2>
        <p><strong>Current Renderer URL:</strong> ${currentUrl}</p>
        <p>To configure a custom renderer, update the URL in the Forge app settings.</p>
        <p><em>Default: Uses shared renderer service</em></p>
      </div>
    `
  };
}

function renderExistingAttachment(content, format, width, height, title) {
  if (format === 'svg') {
    return renderSVG(content, width, height, title);
  } else {
    return renderPNG(content, width, height, title);
  }
}

function renderSVG(svg, width, height, title) {
  const dimensions = clampDimensions(width, height);
  const style = Object.entries(dimensions)
    .map(([key, value]) => `${key}: ${value}px`)
    .join('; ');
  
  const titleHtml = title ? `<h4>${title}</h4>` : '';
  
  return {
    html: `
      <div class="plantuml-diagram">
        ${titleHtml}
        <div style="${style}">${svg}</div>
      </div>
    `
  };
}

function renderPNG(base64, width, height, title) {
  const dimensions = clampDimensions(width, height);
  const style = Object.entries(dimensions)
    .map(([key, value]) => `${key}: ${value}px`)
    .join('; ');
  
  const titleHtml = title ? `<h4>${title}</h4>` : '';
  
  return {
    html: `
      <div class="plantuml-diagram">
        ${titleHtml}
        <img src="data:image/png;base64,${base64}" style="${style}" alt="PlantUML Diagram" />
      </div>
    `
  };
}

module.exports = { render, getAdminPage };