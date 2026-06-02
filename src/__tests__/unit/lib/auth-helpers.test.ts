import { describe, it, expect, vi } from 'vitest';
import { getUserRole, isJudge, isAdmin, canEvaluateSubmissions } from '@/lib/auth-helpers';

// Mock Prisma
vi.mock('@/app/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '@/app/lib/prisma';

describe('getUserRole', () => {
  it('should return user role when user exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'admin',
    } as any);

    const role = await getUserRole('admin@example.com');
    expect(role).toBe('admin');
  });

  it('should return null when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const role = await getUserRole('nonexistent@example.com');
    expect(role).toBeNull();
  });

  it('should return null when database query fails', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(new Error('DB Error'));

    const role = await getUserRole('admin@example.com');
    expect(role).toBeNull();
  });

  it('should return null when role field is not present', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: 'user@example.com',
    } as any);

    const role = await getUserRole('user@example.com');
    expect(role).toBeNull();
  });
});

describe('isJudge', () => {
  it('should return true for judge role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'judge',
    } as any);

    const result = await isJudge('judge@example.com');
    expect(result).toBe(true);
  });

  it('should return true for admin role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'admin',
    } as any);

    const result = await isJudge('admin@example.com');
    expect(result).toBe(true);
  });

  it('should return false for skater role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'skater',
    } as any);

    const result = await isJudge('skater@example.com');
    expect(result).toBe(false);
  });

  it('should return false when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await isJudge('nonexistent@example.com');
    expect(result).toBe(false);
  });
});

describe('isAdmin', () => {
  it('should return true for admin role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'admin',
    } as any);

    const result = await isAdmin('admin@example.com');
    expect(result).toBe(true);
  });

  it('should return false for judge role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'judge',
    } as any);

    const result = await isAdmin('judge@example.com');
    expect(result).toBe(false);
  });

  it('should return false for skater role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'skater',
    } as any);

    const result = await isAdmin('skater@example.com');
    expect(result).toBe(false);
  });

  it('should return false when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await isAdmin('nonexistent@example.com');
    expect(result).toBe(false);
  });
});

describe('canEvaluateSubmissions', () => {
  it('should return true for judge role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'judge',
    } as any);

    const result = await canEvaluateSubmissions('judge@example.com');
    expect(result).toBe(true);
  });

  it('should return true for admin role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'admin',
    } as any);

    const result = await canEvaluateSubmissions('admin@example.com');
    expect(result).toBe(true);
  });

  it('should return false for skater role', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      role: 'skater',
    } as any);

    const result = await canEvaluateSubmissions('skater@example.com');
    expect(result).toBe(false);
  });
});
