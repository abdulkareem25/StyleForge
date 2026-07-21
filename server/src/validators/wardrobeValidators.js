const { z } = require('zod');
const {
  categories,
  formalityTags,
} = require('../constants/categories');

const wardrobeQuerySchema = z.object({
  category: z.enum(categories).optional(),
  color: z.string().max(30).optional(),
  formalityTag: z.enum(formalityTags).optional(),
  occasion: z.enum(formalityTags).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

module.exports = { wardrobeQuerySchema };
