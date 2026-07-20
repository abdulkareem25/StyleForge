require('dotenv').config();
const cron = require('node-cron');
const app = require('./src/app');
const connectDB = require('./src/config/db.js');
const { purgeExpiredDeletions } = require('./src/controllers/userController');

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

app.listen(PORT, () => {
  console.log(`StyleForge API running on port ${PORT}`);
});
