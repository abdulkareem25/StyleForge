require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db.js');

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`StyleForge API running on port ${PORT}`);
});
