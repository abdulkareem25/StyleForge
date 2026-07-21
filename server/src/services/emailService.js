const { BrevoClient } = require('@getbrevo/brevo');

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL || 'no-reply@styleforge.com';
const senderName = 'StyleForge';

let brevoClient = null;
if (apiKey && apiKey !== 'your_brevo_api_key_here' && apiKey.trim() !== '') {
  brevoClient = new BrevoClient({ apiKey });
}

/**
 * Sends a transactional verification email using Brevo.
 * If in development/test and BREVO_API_KEY is missing, logs the mail to console.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} verificationUrl - Verification link
 */
const sendVerificationEmail = async (to, name, verificationUrl) => {
  const subject = 'Verify your StyleForge Account';
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4F46E5; margin-bottom: 20px;">Welcome to StyleForge, ${name}!</h2>
          <p>Thank you for signing up. Please verify your email address to activate your account and start generating outfits.</p>
          <p style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </p>
          <p>This verification link will expire in 24 hours. If you did not create a StyleForge account, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #777;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
  `;

  if (!brevoClient) {
    console.log('\n--- DEVELOPMENT EMAIL SENT ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('------------------------------\n');
    return { success: true, message: '[DEV] Email logged to console' };
  }

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name }],
    });
    return response;
  } catch (error) {
    console.error('Error sending verification email via Brevo:', error.message || error);
    throw new Error('Failed to send verification email', { cause: error });
  }
};

/**
 * Sends a password-reset email using Brevo.
 * If in development/test and BREVO_API_KEY is missing, logs the mail to console.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset link
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  const subject = 'Reset your StyleForge password';
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4F46E5; margin-bottom: 20px;">Password Reset Request</h2>
          <p>We received a request to reset the password for your StyleForge account.</p>
          <p style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email — your password will remain unchanged.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #777;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
  `;

  if (!brevoClient) {
    console.log('\n--- DEVELOPMENT PASSWORD RESET EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('-----------------------------------------\n');
    return { success: true, message: '[DEV] Email logged to console' };
  }

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name }],
    });
    return response;
  } catch (error) {
    console.error('Error sending password reset email via Brevo:', error.message || error);
    throw new Error('Failed to send password reset email', { cause: error });
  }
};

/**
 * Sends a daily "get dressed" reminder email using Brevo.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient first name
 * @param {string} unsubscribeUrl - One-click unsubscribe link
 */
const sendReminderEmail = async (to, name, unsubscribeUrl) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const generateUrl = `${clientUrl}/generate`;
  const subject = 'Time to get dressed!';
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4F46E5; margin-bottom: 20px;">Good morning, ${name}!</h2>
          <p>Let's pick out today's outfit. It takes just a few taps.</p>
          <p style="margin: 30px 0; text-align: center;">
            <a href="${generateUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Generate today's outfit</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #777; text-align: center;">
            <a href="${unsubscribeUrl}" style="color: #777;">Unsubscribe from daily reminders</a>
          </p>
        </div>
      </body>
    </html>
  `;

  if (!brevoClient) {
    console.log('\n--- DEVELOPMENT REMINDER EMAIL ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Unsubscribe: ${unsubscribeUrl}`);
    console.log('-----------------------------------\n');
    return { success: true, message: '[DEV] Email logged to console' };
  }

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name }],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
      },
    });
    return response;
  } catch (error) {
    console.error('Error sending reminder email via Brevo:', error.message || error);
    throw new Error('Failed to send reminder email', { cause: error });
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendReminderEmail,
};
