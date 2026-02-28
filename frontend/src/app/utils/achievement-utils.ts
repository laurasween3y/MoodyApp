export const extractAwarded = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') return [];
  const awarded = (value as { awarded?: unknown }).awarded;
  return Array.isArray(awarded) ? (awarded as string[]) : [];
};
