export const occasionGroups = [
  {
    name: 'Everyday',
    occurrences: [
      { value: 'casual', label: 'Casual' },
      { value: 'smart-casual', label: 'Smart Casual' },
      { value: 'home-wear', label: 'Home Wear' },
      { value: 'college', label: 'College' },
    ],
  },
  {
    name: 'Work',
    occurrences: [
      { value: 'business-casual', label: 'Business Casual' },
      { value: 'professional-office', label: 'Professional Office' },
      { value: 'meetings', label: 'Meetings' },
      { value: 'interviews', label: 'Interviews' },
    ],
  },
  {
    name: 'Celebrations',
    occurrences: [
      { value: 'weddings', label: 'Weddings' },
      { value: 'festivals', label: 'Festivals' },
      { value: 'religious-events', label: 'Religious Events' },
      { value: 'family-gatherings', label: 'Family Gatherings' },
    ],
  },
  {
    name: 'Going Out',
    occurrences: [
      { value: 'parties', label: 'Parties' },
      { value: 'dates', label: 'Dates' },
      { value: 'night-out', label: 'Night Out' },
    ],
  },
  {
    name: 'Away',
    occurrences: [
      { value: 'travel', label: 'Travel' },
      { value: 'vacation', label: 'Vacation' },
    ],
  },
  {
    name: 'Active',
    occurrences: [{ value: 'gym', label: 'Gym' }],
  },
];

export const standardOccasions = occasionGroups.flatMap((group) => group.occurrences.map((occurrence) => occurrence.label));
export const occasions = occasionGroups.flatMap((group) => group.occurrences.map((occurrence) => occurrence.value));

export const CUSTOM_OCCASION_MAX_LENGTH = 60;

export function validateCustomOccasion(value) {
  const normalized = (value || '').trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { isValid: false, error: 'Custom occasion cannot be empty.' };
  }

  if (normalized.length > CUSTOM_OCCASION_MAX_LENGTH) {
    return { isValid: false, error: `Custom occasion must be ${CUSTOM_OCCASION_MAX_LENGTH} characters or fewer.` };
  }

  if (/<|>|&|javascript:|on\w+=|<script/i.test(normalized)) {
    return { isValid: false, error: 'Custom occasion cannot contain HTML or script content.' };
  }

  return { isValid: true, value: normalized };
}

export function getOccasionDisplayLabel(value) {
  if (!value) return '';

  const matchingOption = occasionGroups
    .flatMap((group) => group.occurrences)
    .find((occurrence) => occurrence.value === value || occurrence.label === value);

  if (matchingOption) return matchingOption.label;

  const customValidation = validateCustomOccasion(value);
  return customValidation.isValid ? customValidation.value : '';
}
