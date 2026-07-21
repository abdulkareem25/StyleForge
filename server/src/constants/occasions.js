// Backward-compatible re-export — canonical source is categories.js
const occasionGroups = [
  {
    name: 'Everyday',
    occurrences: [
      { value: 'casual', label: 'Casual', formalityTags: ['casual'] },
      { value: 'smart-casual', label: 'Smart Casual', formalityTags: ['casual'] },
      { value: 'home-wear', label: 'Home Wear', formalityTags: ['casual'] },
      { value: 'college', label: 'College', formalityTags: ['casual'] },
    ],
  },
  {
    name: 'Work',
    occurrences: [
      { value: 'business-casual', label: 'Business Casual', formalityTags: ['office'] },
      { value: 'professional-office', label: 'Professional Office', formalityTags: ['office'] },
      { value: 'meetings', label: 'Meetings', formalityTags: ['office'] },
      { value: 'interviews', label: 'Interviews', formalityTags: ['office'] },
    ],
  },
  {
    name: 'Celebrations',
    occurrences: [
      { value: 'weddings', label: 'Weddings', formalityTags: ['formal'] },
      { value: 'festivals', label: 'Festivals', formalityTags: ['formal', 'ethnic'] },
      { value: 'religious-events', label: 'Religious Events', formalityTags: ['formal', 'ethnic'] },
      { value: 'family-gatherings', label: 'Family Gatherings', formalityTags: ['formal', 'casual'] },
    ],
  },
  {
    name: 'Going Out',
    occurrences: [
      { value: 'parties', label: 'Parties', formalityTags: ['party'] },
      { value: 'dates', label: 'Dates', formalityTags: ['date'] },
      { value: 'night-out', label: 'Night Out', formalityTags: ['party'] },
    ],
  },
  {
    name: 'Away',
    occurrences: [
      { value: 'travel', label: 'Travel', formalityTags: ['travel'] },
      { value: 'vacation', label: 'Vacation', formalityTags: ['travel'] },
    ],
  },
  {
    name: 'Active',
    occurrences: [
      { value: 'gym', label: 'Gym', formalityTags: ['gym'] },
    ],
  },
];

const occasionOptions = occasionGroups.flatMap((group) => group.occurrences);
const standardOccasions = occasionOptions.map((option) => option.label);
const occasions = occasionOptions.map((option) => option.value);
const optionByValue = new Map(occasionOptions.map((option) => [option.value, option]));
const optionByLabel = new Map(occasionOptions.map((option) => [option.label, option]));

const CUSTOM_OCCASION_MAX_LENGTH = 60;
const CUSTOM_OCCASION_REJECTION_PATTERN = /<|>|&|javascript:|on\w+=|<script/i;

function normalizeOccasionValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

function validateCustomOccasion(value) {
  const normalized = normalizeOccasionValue(value);
  if (!normalized) {
    return { isValid: false, error: 'Custom occasion cannot be empty.' };
  }

  if (normalized.length > CUSTOM_OCCASION_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Custom occasion must be ${CUSTOM_OCCASION_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (CUSTOM_OCCASION_REJECTION_PATTERN.test(normalized)) {
    return { isValid: false, error: 'Custom occasion cannot contain HTML or script content.' };
  }

  return { isValid: true, value: normalized };
}

function getOccasionOption(occasion) {
  if (typeof occasion !== 'string') return null;
  const normalized = normalizeOccasionValue(occasion);
  if (!normalized) return null;

  const directMatch = optionByValue.get(normalized) || optionByLabel.get(normalized);
  if (directMatch) return directMatch;

  return null;
}

function getOccasionMatchStrategy(occasion) {
  const option = getOccasionOption(occasion);
  if (option) {
    return { mode: 'hard', formalityTags: option.formalityTags };
  }

  const customValidation = validateCustomOccasion(occasion);
  if (!customValidation.isValid) {
    return { mode: 'invalid', formalityTags: [] };
  }

  return { mode: 'soft', formalityTags: [], customOccasion: customValidation.value };
}

function getOccasionDisplayLabel(occasion) {
  const option = getOccasionOption(occasion);
  if (option) return option.label;

  const customValidation = validateCustomOccasion(occasion);
  return customValidation.isValid ? customValidation.value : '';
}

module.exports = {
  occasionGroups,
  occasionOptions,
  occasions,
  standardOccasions,
  CUSTOM_OCCASION_MAX_LENGTH,
  validateCustomOccasion,
  getOccasionMatchStrategy,
  getOccasionDisplayLabel,
};
