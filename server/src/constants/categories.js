// ─────────────────────────────────────────────────────────────────────
// CAT-01 — Wardrobe Taxonomy Constants (Single Source of Truth)
//
// Every enum used by the WardrobeItem schema, the AI tagging prompt
// (WARD-02), the generation filter, and the client-side forms MUST
// reference this file. Never duplicate enum arrays inline — TAD §6.
// ─────────────────────────────────────────────────────────────────────

// ── Category ────────────────────────────────────────────────────────
const categories = [
  'top',
  'bottom',
  'ethnic',
  'outerwear',
  'footwear',
  'accessory',
];

// ── Sub-category (suggested values — free-text in DB) ───────────────
const subCategories = {
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

// ── Sleeve length ───────────────────────────────────────────────────
const sleeveLengths = ['full', 'half', 'sleeveless', 'n/a'];

// ── Fit ─────────────────────────────────────────────────────────────
const fits = ['regular', 'slim', 'oversized', 'relaxed'];

// ── Pattern ─────────────────────────────────────────────────────────
const patterns = ['solid', 'striped', 'checked', 'printed', 'other'];

// ── Formality / occasion tags ───────────────────────────────────────
const formalityTags = [
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

// ── Season tags ─────────────────────────────────────────────────────
const seasonTags = ['summer', 'winter', 'monsoon', 'all-season'];

// ── Style-preference enums (User model) ─────────────────────────────
const fitPreferences = ['regular', 'slim', 'oversized', 'relaxed'];
const printTolerances = ['low', 'medium', 'high'];

module.exports = {
  categories,
  subCategories,
  sleeveLengths,
  fits,
  patterns,
  formalityTags,
  seasonTags,
  fitPreferences,
  printTolerances,
};
