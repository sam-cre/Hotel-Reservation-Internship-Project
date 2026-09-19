import { describe, expect, it } from 'vitest';
import {
  createHotelMutationSchema,
  createImageUrlValidator,
} from '../../src/modules/catalog/validation.js';

describe('catalog image URL validation', () => {
  const withAllowlist = createImageUrlValidator(new Set(['cdn.example']));
  const withoutAllowlist = createImageUrlValidator();

  it('accepts same-origin managed asset paths', () => {
    expect(withoutAllowlist('/images/hotel.jpg')).toBe(true);
    expect(withAllowlist('/images/hotel.jpg')).toBe(true);
  });

  it('rejects protocol-relative and malformed values', () => {
    expect(withAllowlist('//cdn.example/hotel.jpg')).toBe(false);
    expect(withAllowlist('not a url')).toBe(false);
  });

  it('rejects backslash sequences that browsers normalize to another origin', () => {
    // "/\\evil.example" is "/\evil.example"; browsers read "/\" as "//".
    expect(withAllowlist('/\\evil.example/pixel.gif')).toBe(false);
    expect(withAllowlist('/\\/evil.example/pixel.gif')).toBe(false);
  });

  it('rejects arbitrary remote origins when the allowlist is empty', () => {
    expect(withoutAllowlist('https://tracker.example/pixel.gif')).toBe(false);
  });

  it('accepts only explicitly approved HTTPS hosts', () => {
    expect(withAllowlist('https://cdn.example/hotel.jpg')).toBe(true);
    expect(withAllowlist('https://tracker.example/hotel.jpg')).toBe(false);
  });

  it('rejects insecure HTTP and embedded credentials for approved hosts', () => {
    expect(withAllowlist('http://cdn.example/hotel.jpg')).toBe(false);
    expect(withAllowlist('https://user:pass@cdn.example/hotel.jpg')).toBe(
      false,
    );
  });

  it('applies the allowlist through the hotel mutation schema', () => {
    const base = {
      name: 'The Meridian',
      description: 'A full-service city hotel.',
      city: 'Atlanta',
      address: '100 Peachtree Street, Atlanta, GA',
      rating: 4.6,
    };
    const guarded = createHotelMutationSchema(new Set(['cdn.example']));

    expect(
      guarded.safeParse({ ...base, imageUrl: '/images/meridian.jpg' }).success,
    ).toBe(true);
    expect(
      guarded.safeParse({ ...base, imageUrl: 'https://cdn.example/m.jpg' })
        .success,
    ).toBe(true);
    expect(
      guarded.safeParse({ ...base, imageUrl: 'https://tracker.example/p.gif' })
        .success,
    ).toBe(false);

    const closed = createHotelMutationSchema();
    expect(
      closed.safeParse({ ...base, imageUrl: 'https://cdn.example/m.jpg' })
        .success,
    ).toBe(false);
  });
});
