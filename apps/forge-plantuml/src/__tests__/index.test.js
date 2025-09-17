const { renderDiagram, refreshDiagram } = require('../index');

// Mock Forge API
jest.mock('@forge/api', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
  fetch: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
}));

const { storage, fetch } = require('@forge/api');

describe('PlantUML Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RENDERER_URL = 'https://test-api.com';
    process.env.RENDERER_JWT_SECRET = 'test-secret';
  });

  describe('renderDiagram', () => {
    it('should return error for empty source', async () => {
      const req = { payload: { source: '' } };
      const result = await renderDiagram(req);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No PlantUML source provided');
    });

    it('should return cached diagram if available', async () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const cachedResult = {
        diagramUrl: 'data:image/svg+xml;base64,cached',
        timestamp: Date.now(),
      };

      storage.get.mockResolvedValue(cachedResult);

      const req = { payload: { source } };
      const result = await renderDiagram(req);

      expect(result.success).toBe(true);
      expect(result.diagramUrl).toBe(cachedResult.diagramUrl);
      expect(result.cached).toBe(true);
    });

    it('should render new diagram if not cached', async () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const mockSvg = '<svg>test</svg>';

      storage.get.mockResolvedValue(null);
      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvg),
      });

      const req = { payload: { source } };
      const result = await renderDiagram(req);

      expect(result.success).toBe(true);
      expect(result.diagramUrl).toContain('data:image/svg+xml');
      expect(storage.set).toHaveBeenCalled();
    });
  });

  describe('refreshDiagram', () => {
    it('should clear cache and re-render', async () => {
      const source = '@startuml\nAlice -> Bob\n@enduml';
      const mockSvg = '<svg>refreshed</svg>';

      fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockSvg),
      });

      const req = { payload: { source } };
      const result = await refreshDiagram(req);

      expect(storage.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
