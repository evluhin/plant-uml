import jwt from 'jsonwebtoken';
import axios from 'axios';

const LOCAL_API_URL = 'http://localhost:3001';
const TEST_SECRET = 'test-secret-key-for-local-development';

function createTestJWT(): string {
  const payload = {
    iss: 'plantuml-confluence',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    nonce: `test-${Date.now()}`
  };
  return jwt.sign(payload, TEST_SECRET, { algorithm: 'HS256' });
}

describe('PlantUML Renderer Integration Tests', () => {
  const samplePlantUML = '@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml';

  describe('SVG Rendering', () => {
    it('should render PlantUML to SVG', async () => {
      const token = createTestJWT();
      
      const response = await axios.post(`${LOCAL_API_URL}/render`, {
        source: samplePlantUML,
        format: 'svg'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      expect(response.data).toContain('<svg');
      expect(response.data).toContain('Alice');
      expect(response.data).toContain('Bob');
    });
  });

  describe('PNG Rendering', () => {
    it('should render PlantUML to PNG', async () => {
      const token = createTestJWT();
      
      const response = await axios.post(`${LOCAL_API_URL}/render`, {
        source: samplePlantUML,
        format: 'png'
      }, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      
      // Check PNG signature
      const buffer = Buffer.from(response.data);
      expect(buffer[0]).toBe(0x89); // PNG signature
    });
  });
});