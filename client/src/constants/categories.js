// ─────────────────────────────────────────────────────────────────────
// CAT-01 — Wardrobe Taxonomy Constants (Client Mirror)
//
// This file MUST stay in exact sync with server/src/constants/categories.js.
// It is the ESM copy for Vite / React — same values, different syntax.
// ─────────────────────────────────────────────────────────────────────

export const categories = [
  'top',
  'bottom',
  'ethnic',
  'outerwear',
  'footwear',
  'accessory',
];

export const subCategories = {
  top: [
    'shirt',
    'tshirt',
    'polo',
    'henley',
    'hoodie',
    'sweatshirt',
    'sweater',
    'tank',
    'kurta-top',
  ],
  bottom: [
    'jeans',
    'chinos',
    'trousers',
    'cargo-pants',
    'track-pants',
    'joggers',
    'shorts',
  ],
  ethnic: [
    'kurta',
    'lungi',
    'nehru-jacket',
    'sherwani',
    'dhoti',
    'pathani',
  ],
  outerwear: [
    'jacket',
    'blazer',
    'suit',
    'coat',
    'vest',
    'windbreaker',
    'puffer',
  ],
  footwear: [
    'sneakers',
    'formal-shoes',
    'sandals',
    'boots',
    'loafers',
    'sports-shoes',
    'ethinc-footwear',
  ],
  accessory: [
    'watch',
    'belt',
    'sunglasses',
    'cap',
    'scarf',
    'bag',
    'jewellery',
  ],
};

export const sleeveLengths = ['full', 'half', 'sleeveless', 'n/a'];

export const fits = ['regular', 'slim', 'oversized', 'relaxed'];

export const patterns = ['solid', 'striped', 'checked', 'printed', 'other'];

export const formalityTags = [
  'casual',
  'office',
  'formal',
  'ethnic',
  'party',
  'gym',
  'travel',
  'date',
  'festival',
];

export const seasonTags = ['summer', 'winter', 'monsoon', 'all-season'];

export const fitPreferences = ['regular', 'slim', 'oversized', 'relaxed'];

export const printTolerances = ['low', 'medium', 'high'];
