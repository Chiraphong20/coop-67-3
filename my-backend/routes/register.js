const express = require('express');
const router = express.Router();
const axios = require('axios');
const RICH_MENUS = require('../richmenus');

const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
console.log('🔑 Channel Access Token:', CHANNEL_ACCESS_TOKEN ? '✅ มี token' : '❌ ไม่มี token');

router.post('/', async (req, res) => {
  const { userId, role } = req.body;
  console.log(`📥 ได้รับคำขอเปลี่ยน Rich Menu: userId=${userId}, role=${role}`);

  if (!userId || !role) {
    return res.status(400).json({ message: '❗ userId และ role จำเป็น' });
  }

  const richMenuId = RICH_MENUS[role];

  if (!richMenuId) {
    return res.status(400).json({ message: '❗ ไม่พบ Rich Menu สำหรับ role นี้' });
  }

  try {
    await axios.post(
      `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ เปลี่ยน Rich Menu สำเร็จ');
    return res.status(200).json({ message: '✅ เปลี่ยน Rich Menu เรียบร้อยแล้ว' });
  } catch (err) {
    console.error('❌ Error changing Rich Menu:', err.response?.data || err.message);
    return res.status(500).json({
      message: '❌ เปลี่ยน Rich Menu ล้มเหลว',
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
