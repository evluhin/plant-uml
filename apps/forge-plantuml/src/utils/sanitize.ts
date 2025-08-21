export function sanitizeSVG(svg: string): string {
  // Remove script tags and foreign objects for security
  return svg
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<foreignObject[^>]*>.*?<\/foreignObject>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}