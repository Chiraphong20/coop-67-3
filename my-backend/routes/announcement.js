const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('firebase-admin');

const db = admin.firestore();

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

router.post('/broadcast', async (req, res) => {
  const { title, detail, date, image } = req.body;

  if (!title || !detail || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const snapshot = await db.collection('users').get();
const users = snapshot.docs.map(doc => ({
  userid: doc.id,  
  ...doc.data(),
}));
    console.log(`📦 ข้อมูลประกาศที่กำลังส่ง:`);
    console.log(`📝 title: ${title}`);
    console.log(`📝 detail: ${detail}`);
    console.log(`📅 date: ${date}`);
    if (image) console.log(`🖼️ image: ${image}`);

    const message = {
      type: 'text',
      text: `📢 ประกาศใหม่\nหัวข้อ: ${title}\nเนื้อหา: ${detail}\nวันที่: ${date}`,
    };

    console.log(`👥 รายชื่อผู้ใช้ที่จะส่งข้อความหา (${users.length} คน):`);
    users.forEach(u => console.log(`➡️ userId: ${u.userid}`));

    for (const user of users) {
      await axios.post(
        LINE_PUSH_URL,
        {
          to: user.userid,
          messages: [message],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          },
        }
      );
      console.log(`✅ ส่งข้อความสำเร็จถึง ${user.userid}`);
    }

    res.json({ message: '📨 Broadcast sent to all LINE users' });
  } catch (err) {
    console.error('❌ Error during broadcast:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send LINE broadcast' });
  }
});

module.exports = router;
