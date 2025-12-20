export const CATEGORY_FREQUENCIES = ['one-time', 'subscription'] as const;

export type CategoryFrequency = (typeof CATEGORY_FREQUENCIES)[number];

export const DEFAULT_CATEGORY_FREQUENCY: CategoryFrequency = 'subscription';

export const isCategoryFrequency = (value: unknown): value is CategoryFrequency => {
  return typeof value === 'string' && CATEGORY_FREQUENCIES.includes(value as CategoryFrequency);
};

