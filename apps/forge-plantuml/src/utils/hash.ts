import { createHash } from 'crypto';

export function generateAttachmentHash(
  source: string,
  format: string,
  theme?: string
): string {
  const content = `${source}|${format}|${theme || 'default'}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

export function generateAttachmentName(hash: string, format: string): string {
  return `plantuml-${hash}.${format}`;
}

export function clampDimensions(width?: string, height?: string): { width?: number; height?: number } {
  const result: { width?: number; height?: number } = {};
  
  if (width) {
    const w = parseInt(width, 10);
    if (!isNaN(w) && w > 0) {
      result.width = Math.min(w, 2000); // Max 2000px
    }
  }
  
  if (height) {
    const h = parseInt(height, 10);
    if (!isNaN(h) && h > 0) {
      result.height = Math.min(h, 2000); // Max 2000px
    }
  }
  
  return result;
}