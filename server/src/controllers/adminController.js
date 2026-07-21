const User = require('../models/User');
const WardrobeItem = require('../models/WardrobeItem');
const Outfit = require('../models/Outfit');
const OutfitHistory = require('../models/OutfitHistory');
const RefreshToken = require('../models/RefreshToken');

// ── Disable an abusive account (reversible) ─────────────────────────
// Distinct from AUTH-05's self-service deletion — this is admin-initiated,
// doesn't start a grace-period purge, and can be reversed instantly.
const disableAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('_id email isActive name');
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(409).json({ success: false, data: null, error: 'Account is already disabled' });
    }

    user.isActive = false;
    await user.save();

    // Invalidate all refresh tokens — force re-login on next request
    await RefreshToken.deleteMany({ userId: user._id });

    console.log(`[ADMIN] Account disabled: ${user.email} (${user._id}) by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: { message: `Account ${user.email} has been disabled`, userId: user._id },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Restore a disabled account ──────────────────────────────────────
const restoreAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('_id email isActive name');
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' });
    }

    if (user.isActive) {
      return res.status(409).json({ success: false, data: null, error: 'Account is already active' });
    }

    user.isActive = true;
    await user.save();

    console.log(`[ADMIN] Account restored: ${user.email} (${user._id}) by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: { message: `Account ${user.email} has been restored`, userId: user._id },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Aggregate / anonymized usage metrics ────────────────────────────
// Returns counts only — no individual user data, no wardrobe photos,
// no outfit history (Security doc §2).
const getMetrics = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      deletedUsers,
      verifiedUsers,
      totalWardrobeItems,
      activeWardrobeItems,
      totalOutfits,
      totalWears,
      usersWithFavorites,
      usersWithReminders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ deletedAt: { $ne: null } }),
      User.countDocuments({ emailVerified: true }),
      WardrobeItem.countDocuments(),
      WardrobeItem.countDocuments({ isActive: true }),
      Outfit.countDocuments(),
      OutfitHistory.countDocuments(),
      Outfit.countDocuments({ isFavorite: true }),
      User.countDocuments({ 'stylePreferences.remindersEnabled': true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          disabled: disabledUsers,
          deleted: deletedUsers,
          verified: verifiedUsers,
        },
        wardrobe: {
          totalItems: totalWardrobeItems,
          activeItems: activeWardrobeItems,
        },
        outfits: {
          totalCombinations: totalOutfits,
          totalWears: totalWears,
          favorited: usersWithFavorites,
        },
        reminders: {
          optedIn: usersWithReminders,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── List users (paginated, minimal fields) ──────────────────────────
// Returns only id, name, email, role, isActive, createdAt — no
// wardrobe photos, no outfit history, no style preferences.
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  disableAccount,
  restoreAccount,
  getMetrics,
  listUsers,
};
