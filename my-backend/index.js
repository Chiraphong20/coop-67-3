require('dotenv').config();

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(express.json());

const registerRoute = require('./routes/register');
const announcementRoute = require('./routes/announcement');

app.get('/', (req, res) => {
  res.send('✅ Server is running!');
});

app.use('/api/register', registerRoute);
app.use('/api/announcements', announcementRoute);

console.log('🔎 ENV Loaded:', {
  CHANNEL_ACCESS_TOKEN: process.env.CHANNEL_ACCESS_TOKEN ? '✅' : '❌',
  RICH_MENU_RESIDENT: process.env.RICH_MENU_RESIDENT ? '✅' : '❌',
  RICH_MENU_TECHNICIAN: process.env.RICH_MENU_TECHNICIAN ? '✅' : '❌',
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 5001;
console.log('🚀 Starting server on PORT:', PORT);

app.listen(PORT, () => {
  console.log(`✅ Backend running at: http://localhost:${PORT}`);
});
