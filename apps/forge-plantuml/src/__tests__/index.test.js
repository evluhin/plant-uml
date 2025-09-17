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
      const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <defs>
          <style>
            .actor { fill: #FEFECE; stroke: #A80036; stroke-width: 1.5; }
            .arrow { stroke: #A80036; stroke-width: 1; fill: none; }
            .text { font-family: sans-serif; font-size: 13px; fill: #000000; }
          </style>
        </defs>
        <rect class="actor" x="50" y="20" width="80" height="40" rx="5"/>
        <text class="text" x="90" y="45" text-anchor="middle">Alice</text>
        <rect class="actor" x="270" y="20" width="80" height="40" rx="5"/>
        <text class="text" x="310" y="45" text-anchor="middle">Bob</text>
        <line class="arrow" x1="130" y1="40" x2="270" y2="40" marker-end="url(#arrowhead)"/>
        <text class="text" x="200" y="35" text-anchor="middle">Hello</text>
      </svg>`;

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
      const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <defs>
          <style>
            .actor { fill: #FEFECE; stroke: #A80036; stroke-width: 1.5; }
            .arrow { stroke: #A80036; stroke-width: 1; fill: none; }
            .text { font-family: sans-serif; font-size: 13px; fill: #000000; }
          </style>
        </defs>
        <rect class="actor" x="50" y="20" width="80" height="40" rx="5"/>
        <text class="text" x="90" y="45" text-anchor="middle">Refreshed Alice</text>
        <rect class="actor" x="270" y="20" width="80" height="40" rx="5"/>
        <text class="text" x="310" y="45" text-anchor="middle">Bob</text>
        <line class="arrow" x1="130" y1="40" x2="270" y2="40" marker-end="url(#arrowhead)"/>
        <text class="text" x="200" y="35" text-anchor="middle">Hi there!</text>
      </svg>`;

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
