const request = require('supertest');

describe('Integration Tests - API Endpoints', () => {
  const baseURL = 'http://localhost:5000';

  describe('Health Check Endpoint', () => {
    test('GET /api/health returns healthy status', async () => {
      const response = await request(baseURL)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });

    test('Health check responds quickly', async () => {
      const startTime = Date.now();

      await request(baseURL)
        .get('/api/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Authentication Flow', () => {
    test('POST /api/auth/register validates input', async () => {
      const response = await request(baseURL)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123'
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    test('POST /api/auth/login requires credentials', async () => {
      const response = await request(baseURL)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});