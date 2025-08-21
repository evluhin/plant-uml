import { storage } from '@forge/api';
import { generateAttachmentHash, clampDimensions } from '../utils/hash';
import { sanitizeSVG } from '../utils/sanitize';

interface MacroParameters {
  source?: string;
  format?: 'svg' | 'png';
  width?: string;
  height?: string;
  title?: string;
  theme?: string;
}

export default async function render(req: { payload: MacroParameters }): Promise<{ html: string }> {
  const { source, format = 'svg', width, height, title, theme } = req.payload;
  
  if (!source?.trim()) {
    return {
      html: '<div style="padding: 16px; border: 1px solid #ccc; background: #f5f5f5;">No PlantUML source provided</div>'
    };
  }

  try {
    const hash = generateAttachmentHash(source, format, theme);
    
    // Check if attachment already exists
    const existingAttachment = await storage.get(`attachment:${hash}`);
    if (existingAttachment) {
      return renderExistingAttachment(existingAttachment as string, format, width, height, title);
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

function renderExistingAttachment(content: string, format: string, width?: string, height?: string, title?: string) {
  if (format === 'svg') {
    return renderSVG(content, width, height, title);
  } else {
    return renderPNG(content, width, height, title);
  }
}

function renderSVG(svg: string, width?: string, height?: string, title?: string): { html: string } {
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

function renderPNG(base64: string, width?: string, height?: string, title?: string): { html: string } {
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