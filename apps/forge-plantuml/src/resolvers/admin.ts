import { storage } from '@forge/api';

export default async function getAdminPage(): Promise<{ html: string }> {
  const currentUrl = await storage.get('renderer-url') || 'https://api.plantuml-renderer.example.com';
  
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