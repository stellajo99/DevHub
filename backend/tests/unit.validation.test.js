const Joi = require('joi');

describe('Unit Tests - Input Validation', () => {
  describe('User Registration Validation', () => {
    const userSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).max(50).required()
    });

    test('should validate correct user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe'
      };

      const { error } = userSchema.validate(validUser);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email format', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'John Doe'
      };

      const { error } = userSchema.validate(invalidUser);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });
  });

  describe('Post Creation Validation', () => {
    const postSchema = Joi.object({
      title: Joi.string().min(3).max(100).required(),
      content: Joi.string().min(10).required(),
      tags: Joi.array().items(Joi.string()).max(5)
    });

    test('should validate correct post data', () => {
      const validPost = {
        title: 'Test Post Title',
        content: 'This is a valid test post content with sufficient length.',
        tags: ['javascript', 'testing']
      };

      const { error } = postSchema.validate(validPost);
      expect(error).toBeUndefined();
    });

    test('should reject short content', () => {
      const invalidPost = {
        title: 'Test Post',
        content: 'Too short',
        tags: []
      };

      const { error } = postSchema.validate(invalidPost);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('content');
    });
  });
});