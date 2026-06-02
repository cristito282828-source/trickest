import { describe, it, expect } from 'vitest';
import { validateYouTubeUrl, normalizeYouTubeUrl, extractVideoId } from '@/lib/youtube';

describe('validateYouTubeUrl', () => {
  describe('valid URLs', () => {
    it('should accept standard youtube.com URLs', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=abc123')).toBe(true);
      expect(validateYouTubeUrl('https://youtube.com/watch?v=abc123')).toBe(true);
      expect(validateYouTubeUrl('http://www.youtube.com/watch?v=abc123')).toBe(true);
    });

    it('should accept short youtu.be URLs', () => {
      expect(validateYouTubeUrl('https://youtu.be/abc123')).toBe(true);
      expect(validateYouTubeUrl('http://youtu.be/abc123')).toBe(true);
    });

    it('should accept embed URLs', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/embed/abc123')).toBe(true);
    });

    it('should accept shortened URLs', () => {
      expect(validateYouTubeUrl('https://youtu.be/abc123?t=10s')).toBe(true);
    });

    it('should accept URLs with additional parameters', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=abc123&t=10s&feature=share')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject non-YouTube URLs', () => {
      expect(validateYouTubeUrl('https://vimeo.com/123456')).toBe(false);
      expect(validateYouTubeUrl('https://example.com')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(validateYouTubeUrl('not-a-url')).toBe(false);
      expect(validateYouTubeUrl('youtube')).toBe(false);
      expect(validateYouTubeUrl('')).toBe(false);
    });

    it('should reject YouTube URLs without video ID', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch')).toBe(false);
      expect(validateYouTubeUrl('https://www.youtube.com/')).toBe(false);
    });

    it('should reject URLs with invalid video IDs', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=')).toBe(false);
    });
  });
});

describe('extractVideoId', () => {
  it('should extract video ID from standard URLs', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
    expect(extractVideoId('https://youtube.com/watch?v=test123')).toBe('test123');
  });

  it('should extract video ID from short URLs', () => {
    expect(extractVideoId('https://youtu.be/abc123')).toBe('abc123');
  });

  it('should extract video ID from embed URLs', () => {
    expect(extractVideoId('https://www.youtube.com/embed/abc123')).toBe('abc123');
  });

  it('should return null for invalid URLs', () => {
    expect(extractVideoId('not-a-url')).toBeNull();
    expect(extractVideoId('https://example.com')).toBeNull();
  });
});

describe('normalizeYouTubeUrl', () => {
  it('should normalize various YouTube URL formats to embed URL', () => {
    expect(normalizeYouTubeUrl('https://www.youtube.com/watch?v=abc123'))
      .toBe('https://www.youtube.com/embed/abc123');

    expect(normalizeYouTubeUrl('https://youtu.be/abc123'))
      .toBe('https://www.youtube.com/embed/abc123');

    expect(normalizeYouTubeUrl('https://www.youtube.com/embed/abc123'))
      .toBe('https://www.youtube.com/embed/abc123');
  });

  it('should handle URLs with additional parameters', () => {
    const url = 'https://www.youtube.com/watch?v=abc123&t=10s';
    const normalized = normalizeYouTubeUrl(url);
    expect(normalized).toBe('https://www.youtube.com/embed/abc123');
  });

  it('should return original URL if already in embed format', () => {
    const embedUrl = 'https://www.youtube.com/embed/abc123';
    expect(normalizeYouTubeUrl(embedUrl)).toBe(embedUrl);
  });
});
