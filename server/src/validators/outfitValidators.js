const { z } = require('zod');
const {
  CUSTOM_OCCASION_MAX_LENGTH,
  standardOccasions,
  validateCustomOccasion,
} = require('../constants/occasions');

const occasionSchema = z.union([
  z.enum(standardOccasions),
  z.string().trim().max(CUSTOM_OCCASION_MAX_LENGTH).refine((value) => validateCustomOccasion(value).isValid, {
    message: 'Custom occasion must be a safe, non-empty string.',
  }),
]);

const swapCategories = ['top', 'bottom', 'footwear', 'ethnic'];

const outfitGenerateSchema = z.object({
  occasion: occasionSchema,
  weather: z.enum(['summer', 'winter', 'monsoon', 'any']).default('any'),
  overrideRepeat: z.boolean().optional(),
  swapItemIds: z.array(z.string()).min(1).max(5).optional(),
  swapCategory: z.enum(swapCategories).optional(),
}).refine(
  (data) => {
    const hasSwap = Boolean(data.swapItemIds && data.swapItemIds.length > 0);
    const hasCategory = Boolean(data.swapCategory);
    return hasSwap === hasCategory;
  },
  {
    message: 'swapItemIds and swapCategory must both be provided together',
    path: ['swapItemIds'],
  },
);

const outfitHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
  occasion: z.string().trim().max(60).optional(),
});

const favoritesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

module.exports = { outfitGenerateSchema, outfitHistoryQuerySchema, favoritesQuerySchema };
