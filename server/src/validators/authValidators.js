const { z } = require('zod');

const signupSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
  password: z.string({ error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const preferencesSchema = z.object({
  preferredColors: z.array(z.string().max(30)).max(10).optional(),
  fitPreference: z.enum(['regular', 'slim', 'oversized', 'relaxed']).optional(),
  printTolerance: z.enum(['low', 'medium', 'high']).optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  emailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  preferencesSchema,
};
