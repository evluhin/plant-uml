import { generateAttachmentHash, generateAttachmentName, clampDimensions } from '../utils/hash';

describe('Hash utilities', () => {
  describe('generateAttachmentHash', () => {
    it('should generate consistent hash for same input', () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const hash1 = generateAttachmentHash(source, 'svg');
      const hash2 = generateAttachmentHash(source, 'svg');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different inputs', () => {
      const source1 = '@startuml\nAlice -> Bob\n@enduml';
      const source2 = '@startuml\nBob -> Alice\n@enduml';
      const hash1 = generateAttachmentHash(source1, 'svg');
      const hash2 = generateAttachmentHash(source2, 'svg');
      expect(hash1).not.toBe(hash2);
    });

    it('should include format in hash', () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const svgHash = generateAttachmentHash(source, 'svg');
      const pngHash = generateAttachmentHash(source, 'png');
      expect(svgHash).not.toBe(pngHash);
    });

    it('should include theme in hash', () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const defaultHash = generateAttachmentHash(source, 'svg');
      const themedHash = generateAttachmentHash(source, 'svg', 'plain');
      expect(defaultHash).not.toBe(themedHash);
    });
  });

  describe('generateAttachmentName', () => {
    it('should generate correct filename', () => {
      const hash = 'abc123def456';
      const svgName = generateAttachmentName(hash, 'svg');
      const pngName = generateAttachmentName(hash, 'png');
      
      expect(svgName).toBe('plantuml-abc123def456.svg');
      expect(pngName).toBe('plantuml-abc123def456.png');
    });
  });

  describe('clampDimensions', () => {
    it('should clamp width and height to maximum', () => {
      const result = clampDimensions('3000', '2500');
      expect(result.width).toBe(2000);
      expect(result.height).toBe(2000);
    });

    it('should preserve valid dimensions', () => {
      const result = clampDimensions('800', '600');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should ignore invalid dimensions', () => {
      const result = clampDimensions('invalid', '-100');
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it('should handle undefined dimensions', () => {
      const result = clampDimensions();
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });
  });
});