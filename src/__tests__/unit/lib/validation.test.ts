import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  setPasswordSchema,
  submitTrickSchema,
  createTeamSchema,
} from '@/lib/validation';

describe('registerSchema', () => {
  const validData = {
    email: 'test@example.com',
    password: 'Test123!@',
    name: 'Test User',
  };

  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should require email', () => {
    const result = registerSchema.safeParse({ ...validData, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Email es requerido');
    }
  });

  it('should reject invalid email format', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'invalid-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Formato de email inválido');
    }
  });

  it('should require password with minimum 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Test1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('al menos 8 caracteres');
    }
  });

  it('should require password with uppercase letter', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'test123!@' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('mayúscula');
    }
  });

  it('should require password with lowercase letter', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'TEST123!@' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('minúscula');
    }
  });

  it('should require password with number', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'TestABC!@' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('número');
    }
  });

  it('should require password with special character', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Test12345' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('carácter especial');
    }
  });

  it('should accept name as optional', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Test123!@',
    });
    expect(result.success).toBe(true);
  });

  it('should trim email automatically', () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: '  test@example.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });
});

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword123',
    });
    expect(result.success).toBe(true);
  });

  it('should require email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should require password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('setPasswordSchema', () => {
  it('should accept valid password', () => {
    const result = setPasswordSchema.safeParse({
      password: 'Test123!@',
      confirmPassword: 'Test123!@',
    });
    expect(result.success).toBe(true);
  });

  it('should require password to match confirmation', () => {
    const result = setPasswordSchema.safeParse({
      password: 'Test123!@',
      confirmPassword: 'Different123!@',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('no coinciden');
    }
  });

  it('should enforce password complexity', () => {
    const result = setPasswordSchema.safeParse({
      password: 'weak',
      confirmPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });
});

describe('submitTrickSchema', () => {
  it('should accept valid submission', () => {
    const result = submitTrickSchema.safeParse({
      challengeId: '1',
      videoUrl: 'https://www.youtube.com/watch?v=test123',
    });
    expect(result.success).toBe(true);
  });

  it('should require challengeId', () => {
    const result = submitTrickSchema.safeParse({
      challengeId: '',
      videoUrl: 'https://www.youtube.com/watch?v=test123',
    });
    expect(result.success).toBe(false);
  });

  it('should require videoUrl', () => {
    const result = submitTrickSchema.safeParse({
      challengeId: '1',
      videoUrl: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid YouTube URL', () => {
    const result = submitTrickSchema.safeParse({
      challengeId: '1',
      videoUrl: 'https://vimeo.com/123456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('YouTube');
    }
  });
});

describe('createTeamSchema', () => {
  it('should accept valid team data', () => {
    const result = createTeamSchema.safeParse({
      name: 'Test Team',
      description: 'A test team description',
    });
    expect(result.success).toBe(true);
  });

  it('should require team name', () => {
    const result = createTeamSchema.safeParse({
      name: '',
      description: 'A description',
    });
    expect(result.success).toBe(false);
  });

  it('should require minimum name length', () => {
    const result = createTeamSchema.safeParse({
      name: 'AB',
      description: 'A description',
    });
    expect(result.success).toBe(false);
  });

  it('should allow description to be optional', () => {
    const result = createTeamSchema.safeParse({
      name: 'Test Team',
    });
    expect(result.success).toBe(true);
  });

  it('should trim name automatically', () => {
    const result = createTeamSchema.safeParse({
      name: '  Test Team  ',
      description: 'A description',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Team');
    }
  });
});
