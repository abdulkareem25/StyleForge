const { getOccasionMatchStrategy } = require('../constants/occasions');
const { generateCombinationHash } = require('../utils/comboHash');
const WardrobeItem = require('../models/WardrobeItem');
const OutfitHistory = require('../models/OutfitHistory');
const User = require('../models/User');

function buildOccasionFilter(occasion) {
  const strategy = getOccasionMatchStrategy(occasion);
  if (strategy.mode === 'hard') {
    return { formalityTags: { $in: strategy.formalityTags } };
  }
  return null;
}

function normalizeItem(item) {
  return item && typeof item.toObject === 'function' ? item.toObject() : item;
}

function getItemId(item) {
  return item && (item._id || item.id || item);
}

function getItemValue(item, field, fallback = null) {
  const normalized = normalizeItem(item);
  return normalized && normalized[field] !== undefined ? normalized[field] : fallback;
}

function filterEligibleItems(items, occasion, weather) {
  const strategy = getOccasionMatchStrategy(occasion);
  const normalizedWeather = typeof weather === 'string' ? weather.toLowerCase() : '';

  return (items || []).filter((item) => {
    const normalized = normalizeItem(item);
    if (!normalized || normalized.isActive === false) {
      return false;
    }

    const matchesOccasion = strategy.mode !== 'hard'
      || (Array.isArray(normalized.formalityTags) && normalized.formalityTags.some((tag) => strategy.formalityTags.includes(tag)));

    const matchesWeather = Array.isArray(normalized.seasonTags)
      && normalized.seasonTags.some((tag) => tag === normalizedWeather || tag === 'all-season');

    return matchesOccasion && matchesWeather;
  });
}

function buildCandidates(tops, bottoms, footwearItems) {
  const candidates = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const footwear of footwearItems) {
        const itemIds = [top, bottom, footwear]
          .map((item) => getItemId(item))
          .filter(Boolean)
          .map((id) => id.toString())
          .sort();

        if (itemIds.length === 0) {
          continue;
        }

        candidates.push({
          itemIds,
          combinationHash: generateCombinationHash(itemIds),
          items: [top, bottom, footwear],
        });
      }
    }
  }

  return candidates;
}

function getLastWornDate(candidate, historyEntries) {
  const matchingEntries = (historyEntries || []).filter(
    (entry) => entry && entry.combinationHash === candidate.combinationHash,
  );

  if (matchingEntries.length === 0) {
    return null;
  }

  return matchingEntries
    .map((entry) => new Date(entry.wornDate))
    .reduce((latest, current) => (current > latest ? current : latest));
}

function compareCandidatesByLastWornDate(candidateA, candidateB, historyEntries) {
  const dateA = getLastWornDate(candidateA, historyEntries);
  const dateB = getLastWornDate(candidateB, historyEntries);

  if (dateA === null && dateB === null) return 0;
  if (dateA === null) return -1;
  if (dateB === null) return 1;
  return dateA - dateB;
}

function scoreCandidate(candidate, stylePreferences) {
  const preferredColors = Array.isArray(stylePreferences && stylePreferences.preferredColors)
    ? stylePreferences.preferredColors.map((color) => String(color).toLowerCase())
    : [];
  const fitPreference = stylePreferences && stylePreferences.fitPreference
    ? String(stylePreferences.fitPreference).toLowerCase()
    : null;
  const printTolerance = stylePreferences && stylePreferences.printTolerance
    ? String(stylePreferences.printTolerance).toLowerCase()
    : 'medium';

  let score = 0;

  for (const item of candidate.items || []) {
    const normalized = normalizeItem(item);
    const colorValues = [getItemValue(normalized, 'primaryColor'), getItemValue(normalized, 'secondaryColor')]
      .filter(Boolean)
      .map((color) => String(color).toLowerCase());

    if (preferredColors.length > 0 && colorValues.some((color) => preferredColors.includes(color))) {
      score += 2;
    }

    if (fitPreference && getItemValue(normalized, 'fit') === fitPreference) {
      score += 1;
    }

    const pattern = getItemValue(normalized, 'pattern', 'solid');
    if (printTolerance === 'low' && pattern === 'solid') {
      score += 1;
    } else if (printTolerance === 'high' && pattern !== 'solid') {
      score += 1;
    }
  }

  return score;
}

function rankCandidates(candidates, stylePreferences) {
  return [...candidates]
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, stylePreferences),
    }))
    .sort((candidateA, candidateB) => {
      if (candidateB.score !== candidateA.score) {
        return candidateB.score - candidateA.score;
      }
      return candidateA.itemIds.join('|').localeCompare(candidateB.itemIds.join('|'));
    });
}

async function generateOutfits(userId, options = {}, deps = {}) {
  const resolvedDeps = {
    findWardrobeItems: deps.findWardrobeItems || (async () => WardrobeItem.find({ userId, isActive: true }).lean().exec()),
    findRecentHistory: deps.findRecentHistory || (async (_resolvedUserId, cutoff) => OutfitHistory.find({ userId: _resolvedUserId, wornDate: { $gte: cutoff } }).sort({ wornDate: 1 }).lean().exec()),
    findHistory: deps.findHistory || (async (_resolvedUserId) => OutfitHistory.find({ userId: _resolvedUserId }).sort({ wornDate: 1 }).lean().exec()),
    getUserPreferences: deps.getUserPreferences || (async (_resolvedUserId) => {
      const user = await User.findById(_resolvedUserId).lean().exec();
      return user && user.stylePreferences ? user.stylePreferences : null;
    }),
  };

  const occasion = options && options.occasion ? options.occasion : '';
  const weather = options && options.weather ? options.weather : 'any';
  const overrideRepeat = Boolean(options && options.overrideRepeat);

  const wardrobeItems = await resolvedDeps.findWardrobeItems(userId);
  const eligibleItems = filterEligibleItems(wardrobeItems, occasion, weather);

  if (!eligibleItems.length) {
    return {
      outfits: [],
      usedFallback: false,
      resultState: 'no-eligible-items',
    };
  }

  const tops = eligibleItems.filter((item) => ['top', 'ethnic'].includes(getItemValue(item, 'category')));
  const bottoms = eligibleItems.filter((item) => getItemValue(item, 'category') === 'bottom');
  const footwear = eligibleItems.filter((item) => getItemValue(item, 'category') === 'footwear');

  if (tops.length === 0 || bottoms.length === 0 || footwear.length === 0) {
    return {
      outfits: [],
      usedFallback: false,
      resultState: 'no-eligible-items',
    };
  }

  const candidates = buildCandidates(tops, bottoms, footwear);
  if (candidates.length === 0) {
    return {
      outfits: [],
      usedFallback: false,
      resultState: 'no-eligible-items',
    };
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);

  const historyEntries = await (deps.findHistory
    ? deps.findHistory(userId, cutoff)
    : deps.findRecentHistory
      ? deps.findRecentHistory(userId, cutoff)
      : resolvedDeps.findRecentHistory(userId, cutoff));
  const recentHistory = (historyEntries || []).filter((entry) => entry && entry.wornDate && new Date(entry.wornDate) >= cutoff);
  const recentHashes = new Set(recentHistory.map((entry) => entry.combinationHash).filter(Boolean));

  const freshCandidates = candidates.filter((candidate) => !recentHashes.has(candidate.combinationHash));

  if (overrideRepeat) {
    const ranked = rankCandidates(candidates, await resolvedDeps.getUserPreferences(userId));
    return {
      outfits: ranked.slice(0, 3).map((candidate) => ({
        itemIds: candidate.itemIds,
        combinationHash: candidate.combinationHash,
        score: candidate.score,
      })),
      usedFallback: false,
      resultState: 'repeat-override',
      overrideRepeat: true,
    };
  }

  if (freshCandidates.length > 0) {
    const ranked = rankCandidates(freshCandidates, await resolvedDeps.getUserPreferences(userId));
    return {
      outfits: ranked.slice(0, 3).map((candidate) => ({
        itemIds: candidate.itemIds,
        combinationHash: candidate.combinationHash,
        score: candidate.score,
      })),
      usedFallback: false,
      resultState: 'success',
    };
  }

  const fallbackCandidates = [...candidates].sort((candidateA, candidateB) => compareCandidatesByLastWornDate(candidateA, candidateB, historyEntries));
  const [fallbackCandidate] = fallbackCandidates;
  const rankedFallback = rankCandidates([fallbackCandidate], await resolvedDeps.getUserPreferences(userId));

  return {
    outfits: rankedFallback.slice(0, 1).map((candidate) => ({
      itemIds: candidate.itemIds,
      combinationHash: candidate.combinationHash,
      score: candidate.score,
    })),
    usedFallback: true,
    resultState: 'all-fresh-exhausted',
  };
}

module.exports = {
  buildOccasionFilter,
  filterEligibleItems,
  buildCandidates,
  rankCandidates,
  generateOutfits,
};
