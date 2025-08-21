import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface PlantUMLOptions {
  format: 'svg' | 'png';
  theme?: string;
}

export async function renderPlantUMLLocal(source: string, options: PlantUMLOptions): Promise<Buffer> {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Mock PlantUML rendering for local development
    console.log('Mock PlantUML rendering - development mode');
    
    if (options.format === 'svg') {
      const mockSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
        <rect width="200" height="100" fill="#f0f0f0" stroke="#333"/>
        <text x="100" y="30" text-anchor="middle" font-family="Arial" font-size="12">PlantUML Mock</text>
        <text x="100" y="50" text-anchor="middle" font-family="Arial" font-size="10">${source.split('\n')[1] || 'Test Diagram'}</text>
        <text x="100" y="70" text-anchor="middle" font-family="Arial" font-size="8">Format: ${options.format}</text>
      </svg>`;
      return Buffer.from(mockSVG, 'utf-8');
    } else {
      // Mock PNG - minimal 1x1 PNG
      const mockPNG = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
      ]);
      return mockPNG;
    }
  }
  
  // In production, use real PlantUML
  const { renderPlantUML } = await import('./plantuml');
  return renderPlantUML(source, options);
}