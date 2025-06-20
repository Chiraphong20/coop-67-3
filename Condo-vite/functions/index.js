const functions = require("firebase-functions");
const fetch = require("node-fetch");
require("dotenv").config();

const roleMenus = {
  resident: 'richmenu-dc6d9ecfe8aeb44ba250f9c18bd8e0c0',
  juristic: 'richmenu-yyyyy',
  technician: 'richmenu-zzzzz',
};

exports.linkRichMenu = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { userId, role } = req.body;

  if (!userId || !role || !roleMenus[role]) {
    return res.status(400).json({ message: 'Invalid userId or role' });
  }

  const richMenuId = roleMenus[role];

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    return res.status(200).json({ message: 'Rich menu linked successfully' });
  } catch (error) {
    console.error('Linking error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
});
