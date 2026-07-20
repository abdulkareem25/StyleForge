const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const WardrobeItem = require('../models/WardrobeItem');
const Outfit = require('../models/Outfit');
const OutfitHistory = require('../models/OutfitHistory');
const { deleteImages } = require('../services/imageService');

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  expires: new Date(0),
};

// ── Soft-delete current user's account (Phase 1 — immediate) ─────────
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Flag as deleted — data retained for 30-day grace period
    await User.findByIdAndUpdate(userId, { deletedAt: new Date() });

    // Invalidate all refresh tokens immediately (force re-login)
    await RefreshToken.deleteMany({ userId });

    // Clear the current session's refresh-token cookie
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: { message: 'Account deleted. You have 30 days to contact support to restore it.' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Hard-purge expired soft-deleted accounts (Phase 2 — scheduled) ───
// Called by the daily cron job. Finds users past the 30-day grace period
// and permanently removes all associated data + images.
const purgeExpiredDeletions = async () => {
  const GRACE_PERIOD_MS = User.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

  // Find users whose grace period has expired
  const expiredUsers = await User.find({
    deletedAt: { $ne: null, $lte: cutoff },
  }).select('_id email');

  if (expiredUsers.length === 0) return;

  console.log(`[PURGE] Hard-deleting ${expiredUsers.length} expired account(s)...`);

  for (const user of expiredUsers) {
    try {
      // Collect all ImageKit URLs before deleting Mongo documents
      const items = await WardrobeItem.find({ userId: user._id }).select('imageUrl thumbnailUrl');
      const imageUrls = items.flatMap((item) => [item.imageUrl, item.thumbnailUrl].filter(Boolean));

      // Delete images from ImageKit (best-effort)
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }

      // Cascade-delete all Mongo documents (order matters for referential integrity)
      await OutfitHistory.deleteMany({ userId: user._id });
      await Outfit.deleteMany({ userId: user._id });
      await WardrobeItem.deleteMany({ userId: user._id });
      await RefreshToken.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });

      console.log(`[PURGE] Permanently deleted account ${user.email} (${user._id})`);
    } catch (error) {
      console.error(`[PURGE] Failed to delete account ${user.email} (${user._id}):`, error.message || error);
    }
  }
};

// ── Restore a soft-deleted account (within 30-day grace period) ───────
const restoreAccount = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Email is required',
      });
    }

    const user = await User.findOne({ email }).setOptions({ withDeleted: true });

    if (!user || !user.deletedAt) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'No deleted account found for this email',
      });
    }

    // Check if grace period has expired
    const graceExpiry = new Date(user.deletedAt.getTime() + User.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    if (Date.now() > graceExpiry) {
      return res.status(410).json({
        success: false,
        data: null,
        error: 'Grace period has expired. The account has been permanently deleted.',
      });
    }

    // Restore the account
    user.deletedAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: 'Account restored successfully. You can now log in.' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  updatePreferences: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  deleteAccount,
  restoreAccount,
  purgeExpiredDeletions,
};
