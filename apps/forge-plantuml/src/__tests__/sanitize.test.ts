import { sanitizeSVG } from '../utils/sanitize';

describe('SVG sanitization', () => {
  it('should remove script tags', () => {
    const maliciousSVG = `
      <svg>
        <script>alert('xss')</script>
        <rect width="100" height="100"/>
      </svg>
    `;
    
    const sanitized = sanitizeSVG(maliciousSVG);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
    expect(sanitized).toContain('<rect');
  });

  it('should remove foreignObject tags', () => {
    const maliciousSVG = `
      <svg>
        <foreignObject>
          <div onclick="alert('xss')">Click me</div>
        </foreignObject>
        <circle r="50"/>
      </svg>
    `;
    
    const sanitized = sanitizeSVG(maliciousSVG);
    expect(sanitized).not.toContain('<foreignObject>');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('<circle');
  });

  it('should remove javascript: URLs', () => {
    const maliciousSVG = `
      <svg>
        <a href="javascript:alert('xss')">
          <text>Click me</text>
        </a>
      </svg>
    `;
    
    const sanitized = sanitizeSVG(maliciousSVG);
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('<text>');
  });

  it('should remove event handlers', () => {
    const maliciousSVG = `
      <svg>
        <rect onclick="alert('xss')" onmouseover="alert('hover')" width="100" height="100"/>
      </svg>
    `;
    
    const sanitized = sanitizeSVG(maliciousSVG);
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onmouseover');
    expect(sanitized).toContain('<rect');
    expect(sanitized).toContain('width="100"');
  });

  it('should preserve clean SVG', () => {
    const cleanSVG = `
      <svg width="100" height="100">
        <rect x="10" y="10" width="80" height="80" fill="blue"/>
        <text x="50" y="50" text-anchor="middle">Hello</text>
      </svg>
    `;
    
    const sanitized = sanitizeSVG(cleanSVG);
    expect(sanitized).toContain('<rect');
    expect(sanitized).toContain('<text');
    expect(sanitized).toContain('fill="blue"');
    expect(sanitized).toContain('Hello');
  });
});