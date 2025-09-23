const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Unit Tests - Authentication', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const secret = 'test-secret-key';

      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);

      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    test('should reject invalid token', () => {
      const secret = 'test-secret-key';
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });
  });
});