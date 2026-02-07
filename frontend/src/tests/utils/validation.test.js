import { describe, it, expect } from 'vitest';
import { loginSchema, externalContactSchema, changePasswordSchema } from '../../utils/validation';

describe('Validation Utils', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('sanitizes email (lowercase and trim)', () => {
      const result = loginSchema.safeParse({
        email: '  Test@Example.COM  ',
        password: 'password123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('externalContactSchema', () => {
    it('validates valid contact', () => {
      const result = externalContactSchema.safeParse({
        name: 'John Doe',
        phone: '+1234567890',
        relationship: 'Friend',
        address: '123 St',
      });
      expect(result.success).toBe(true);
    });

    it('sanitizes phone number', () => {
      const result = externalContactSchema.safeParse({
        name: 'John',
        phone: '123-456-7890',
        relationship: 'Friend',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe('1234567890');
      }
    });

    it('rejects invalid phone length', () => {
      const result = externalContactSchema.safeParse({
        name: 'John',
        phone: '123',
        relationship: 'Friend',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('between 8 and 15 digits');
      }
    });
  });

  describe('changePasswordSchema', () => {
    it('validates matching passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'Password123',
        confirmPassword: 'Password124',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match");
      }
    });

    it('enforces password complexity', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });
});
