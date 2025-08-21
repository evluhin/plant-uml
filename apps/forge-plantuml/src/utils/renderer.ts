import { storage } from '@forge/api';
import { generateJWT } from './jwt';

export interface RenderRequest {
  source: string;
  format: 'svg' | 'png';
  theme?: string;
}

export interface RenderResponse {
  svg?: string;
  pngBase64?: string;
  metrics: {
    renderMs: number;
    coldStart: boolean;
  };
}

export async function renderDiagram(request: RenderRequest): Promise<RenderResponse> {
  const rendererUrl = await getRendererUrl();
  const token = await generateJWT();
  
  const response = await fetch(`${rendererUrl}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error(`Renderer failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<RenderResponse>;
}

export async function getRendererUrl(): Promise<string> {
  const stored = await storage.get('renderer-url');
  if (stored) {
    return stored as string;
  }
  
  // Default shared renderer URL - should be configured in admin
  const defaultUrl = process.env.RENDERER_URL || 'https://api.plantuml-renderer.example.com';
  await storage.set('renderer-url', defaultUrl);
  return defaultUrl;
}

export async function setRendererUrl(url: string): Promise<void> {
  await storage.set('renderer-url', url);
}

export async function testRendererHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const response = await renderDiagram({
      source: '@startuml\nAlice -> Bob: Hello\n@enduml',
      format: 'svg'
    });
    
    return { 
      healthy: !!response.svg && response.svg.includes('<svg'),
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}