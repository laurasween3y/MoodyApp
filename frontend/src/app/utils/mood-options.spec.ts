import { MOOD_OPTIONS, filterMoodOptions } from './mood-options';

describe('mood-options', () => {
  it('returns all options when allowed is undefined', () => {
    expect(filterMoodOptions()).toEqual(MOOD_OPTIONS);
  });

  it('returns all options when allowed is empty', () => {
    expect(filterMoodOptions([])).toEqual(MOOD_OPTIONS);
  });

  it('filters options by allowed keys', () => {
    const result = filterMoodOptions(['happy', 'sad']);
    expect(result.map((m) => m.key)).toEqual(['happy', 'sad']);
  });
});
