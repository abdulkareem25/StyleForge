const User = require('../models/User');
const { hashPassword } = require('../utils/hashUtils');
const { generateVerificationToken, hashVerificationToken } = require('../utils/tokenUtils');
const { sendVerificationEmail } = require('../services/emailService');

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

module.exports = {
  signup,
  verifyEmail,
  login: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  refresh: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  logout: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  forgotPassword: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
  resetPassword: (req, res) => { res.status(501).json({ success: false, data: null, error: 'Not implemented' }); },
};
