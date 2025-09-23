const request = require('supertest');

describe('Integration Tests - Posts API', () => {
  const baseURL = 'http://localhost:5000';

  describe('Posts CRUD Operations', () => {
    test('GET /api/posts returns posts list', async () => {
      const response = await request(baseURL)
        .get('/api/posts')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    test('POST /api/posts requires authentication', async () => {
      const response = await request(baseURL)
        .post('/api/posts')
        .send({
          title: 'Test Post',
          content: 'This is a test post content that should require authentication.'
        })
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('Returns 404 for non-existent post', async () => {
      const response = await request(baseURL)
        .get('/api/posts/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.status).toBe(404);
    });

    test('Handles malformed request gracefully', async () => {
      const response = await request(baseURL)
        .get('/api/posts/invalid-id')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});