require('dotenv').config();
const cron = require('node-cron');
const app = require('./src/app');
const connectDB = require('./src/config/db.js');
const { purgeExpiredDeletions } = require('./src/controllers/userController');
const User = require('./src/models/User');
const { sendReminderEmail } = require('./src/services/emailService');

const PORT = process.env.PORT || 5000;

connectDB();

// ── Scheduled job: hard-purge expired soft-deleted accounts ──────────
// Runs daily at 03:00 UTC — AUTH-05 Phase 2
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Running daily account purge job...');
  try {
    await purgeExpiredDeletions();
  } catch (error) {
    console.error('[CRON] Purge job failed:', error.message || error);
  }
});

// ── Scheduled job: daily "get dressed" reminder emails ───────────────
// Runs every 30 minutes; checks users whose reminderTime falls in the
// current ±30min window based on their local offset from UTC.
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Checking for due reminder emails...');
  try {
    const now = new Date();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    // Find all users with reminders enabled and a reminderTime set
    const users = await User.find({
      'stylePreferences.remindersEnabled': true,
      'stylePreferences.reminderTime': { $ne: null },
      emailVerified: true,
      deletedAt: null,
    }).select('name email stylePreferences.reminderTime stylePreferences.reminderUnsubToken');

    let sentCount = 0;

    for (const user of users) {
      const timeParts = user.stylePreferences.reminderTime.split(':');
      const reminderMinutes = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

      // Calculate the difference in minutes (handle midnight wrap-around)
      let diff = currentMinutes - reminderMinutes;
      if (diff < -720) diff += 1440;
      if (diff > 720) diff -= 1440;

      // Send if within ±30 minute window
      if (Math.abs(diff) <= 30) {
        try {
          const unsubUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/v1/users/unsubscribe-reminder?token=${user.stylePreferences.reminderUnsubToken}`;
          const firstName = user.name.split(' ')[0];
          await sendReminderEmail(user.email, firstName, unsubUrl);
          sentCount++;
        } catch (error) {
          console.error(`[CRON] Failed to send reminder to ${user.email}:`, error.message || error);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[CRON] Sent ${sentCount} reminder email(s)`);
    }
  } catch (error) {
    console.error('[CRON] Reminder job failed:', error.message || error);
  }
});

app.listen(PORT, () => {
  console.log(`StyleForge API running on port ${PORT}`);
});
