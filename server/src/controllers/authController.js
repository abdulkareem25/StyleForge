const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  hashVerificationToken,
} = require('../utils/tokenUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate email (direct message UX per Security doc §7)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'This email is already registered',
      });
    }

    // Block re-signup during the 30-day grace period (AUTH-05)
    // Use withDeleted to find soft-deleted users that the pre-find hook would hide
    const deletedUser = await User.findOne({ email }).setOptions({ withDeleted: true });
    if (deletedUser && deletedUser.deletedAt) {
      const daysRemaining = Math.ceil(
        (deletedUser.deletedAt.getTime() + User.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000),
      );
      return res.status(409).json({
        success: false,
        data: null,
        error: `This email is pending deletion. Please contact support to restore your account, or try again in ${daysRemaining} day(s).`,
      });
    }

    // Hash the password with bcrypt (slow hash, cost factor 12)
    const passwordHash = await hashPassword(password);

    // Generate verification token and its hash
    const rawToken = generateVerificationToken();
    const hashedToken = hashVerificationToken(rawToken);

    // Token expiry
    const expiryHours = parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS, 10) || 24;
    const verificationTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Create unverified User document
    const user = new User({
      name,
      email,
      passwordHash,
      emailVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpiry,
    });

    await user.save();

    // Verification link points to backend verify-email endpoint, which verifies and redirects
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${rawToken}`;

    try {
      await sendVerificationEmail(email, name, verificationUrl);
    } catch (emailError) {
      // Rollback user creation if email fails
      await User.deleteOne({ _id: user._id });
      return next(emailError);
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Verification email sent. Please check your inbox.',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Verification token is required',
      });
    }

    const hashedToken = hashVerificationToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
      emailVerified: false,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!user) {
      // Redirect with error query param if it's a browser click
      const prefersHtml = req.accepts(['json', 'html']) === 'html';
      if (prefersHtml && !req.xhr) {
        return res.redirect(`${clientUrl}/login?error=invalid_token`);
      }
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid or expired verification token',
      });
    }

    // Verify user
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Redirect to login page on success if it's a browser click
    const prefersHtml = req.accepts(['json', 'html']) === 'html';
    if (prefersHtml && !req.xhr) {
      return res.redirect(`${clientUrl}/login?verified=true`);
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Email verified successfully. You can now log in.',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const DUMMY_HASH = '$2a$12$x'.padEnd(60, '0');

    // Use withDeleted to find soft-deleted users (AUTH-05 grace-period restoration)
    const user = await User.findOne({ email }).setOptions({ withDeleted: true });

    // Security doc §7: identical error for invalid email AND invalid password
    if (!user) {
      await comparePassword(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
    }

    // Soft-deleted accounts are hidden from login (no restoration via login — use DELETE /me restore endpoint)
    if (user.deletedAt) {
      await comparePassword(password, DUMMY_HASH);
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
    }

    // Unverified accounts — distinct message per acceptance criteria
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
    }

    // Issue access token (short-lived JWT)
    const accessToken = generateAccessToken({ id: user._id, email: user.email });

    // Issue refresh token (opaque random, stored hashed)
    const { rawToken, tokenHash } = generateRefreshToken();

    const refreshDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    // Capture device/user-agent (Security doc §1 — retrofitting UI later is easy, retrofitting stored data isn't)
    const deviceInfo = req.headers['user-agent'] || null;

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      deviceInfo,
    });

    // httpOnly cookie — never accessible via JavaScript (Security doc §10)
    res.cookie('refreshToken', rawToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: expiresAt,
    });

    // Access token in response body — client holds in memory only
    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Helper: clear refresh-token cookie ─────────────────────────────────
const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  expires: new Date(0), // epoch — tells browser to delete immediately
};

// ── Refresh (token rotation per TAD §10) ──────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Refresh token not found',
      });
    }

    const tokenHash = hashVerificationToken(rawToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    // Fail closed: missing, revoked, or expired → reject
    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid or expired refresh token',
      });
    }

    // Revoke the old token immediately (rotation — TAD §10)
    storedToken.revoked = true;
    await storedToken.save();

    // Look up the user to issue a fresh access token
    const user = await User.findById(storedToken.userId).setOptions({ withDeleted: true });
    if (!user || !user.isActive || user.deletedAt) {
      res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        data: null,
        error: 'User not found or deactivated',
      });
    }

    // Issue new access token
    const accessToken = generateAccessToken({ id: user._id, email: user.email });

    // Issue new refresh token (preserve original expiry window so
    // "remember me" preference survives across rotations)
    const { rawToken: newRaw, tokenHash: newHash } = generateRefreshToken();
    const daysRemaining = Math.ceil(
      (storedToken.expiresAt - storedToken.createdAt) / (24 * 60 * 60 * 1000),
    );
    const newExpiresAt = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newHash,
      expiresAt: newExpiresAt,
      deviceInfo: storedToken.deviceInfo,
    });

    // Set new httpOnly cookie
    res.cookie('refreshToken', newRaw, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: newExpiresAt,
    });

    res.status(200).json({
      success: true,
      data: { accessToken },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Logout (this device — revoke the current session's token) ─────────
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;

    if (rawToken) {
      const tokenHash = hashVerificationToken(rawToken);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
    }

    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Logout everywhere (revoke ALL refresh tokens for this user) ───────
const logoutEverywhere = async (req, res, next) => {
  try {
    await RefreshToken.deleteMany({ userId: req.user.id });

    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out from all devices' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Forgot password (Security doc §1, §7 — identical response either way) ─
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return the same response to prevent account enumeration
    const genericResponse = {
      success: true,
      data: { message: 'If that email exists, we\'ve sent a reset link.' },
      error: null,
    };

    const user = await User.findOne({ email });

    if (user) {
      // Invalidate any previous reset token (single-use: new request replaces old)
      const rawToken = generateVerificationToken();
      const hashedToken = hashVerificationToken(rawToken);

      const expiryMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES, 10) || 60;
      const passwordResetExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

      user.passwordResetToken = hashedToken;
      user.passwordResetExpiry = passwordResetExpiry;
      await user.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

      // Best-effort email — don't leak timing or failure info
      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch {
        // Swallow email errors — generic response regardless
      }
    }

    // Identical response whether user exists or not
    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// ── Reset password (single-use token, invalidates all refresh tokens) ─
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = hashVerificationToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.passwordHash = await hashPassword(password);

    // Clear reset token fields (single-use)
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    // Credential change → force re-login everywhere (Security doc §1)
    await RefreshToken.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      data: { message: 'Password reset successful. Please log in with your new password.' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// ── Change password (authenticated, re-authenticates with current) ────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User not found',
      });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Current password is incorrect',
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Credential change → force re-login everywhere (Security doc §1)
    await RefreshToken.deleteMany({ userId });

    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully. Please log in again.' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  logoutEverywhere,
  forgotPassword,
  resetPassword,
  changePassword,
};
