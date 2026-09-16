import { describe, expect, it } from 'vitest';
import { createHotelMutationSchema } from '../../src/modules/catalog/validation.js';

const base = {
  name: 'The Meridian',
  description: 'A full-service city hotel.',
  city: 'Atlanta',
  address: '100 Peachtree Street, Atlanta, GA',
  rating: 4.6,
  imageUrl: '/images/meridian.jpg',
};

const schema = createHotelMutationSchema();

function parse(amenities) {
  return schema.safeParse(
    amenities === undefined ? base : { ...base, amenities },
  );
}

describe('hotel amenities validation', () => {
  it('defaults to an empty list when omitted', () => {
    const result = parse(undefined);
    expect(result.success).toBe(true);
    expect(result.data.amenities).toEqual([]);
  });

  it('accepts a trimmed list of amenities', () => {
    const result = parse(['  Rooftop terrace  ', 'Valet parking']);
    expect(result.success).toBe(true);
    expect(result.data.amenities).toEqual(['Rooftop terrace', 'Valet parking']);
  });

  it('accepts up to twelve amenities', () => {
    const twelve = Array.from({ length: 12 }, (_, index) => `Amenity ${index}`);
    expect(parse(twelve).success).toBe(true);
  });

  it('rejects more than twelve amenities', () => {
    const thirteen = Array.from(
      { length: 13 },
      (_, index) => `Amenity ${index}`,
    );
    expect(parse(thirteen).success).toBe(false);
  });

  it('rejects blank and over-length amenities', () => {
    expect(parse(['   ']).success).toBe(false);
    expect(parse(['a'.repeat(61)]).success).toBe(false);
  });
});
