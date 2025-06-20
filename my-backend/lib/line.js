const axios = require("axios");

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

const headers = {
  Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

const switchRichMenu = async (userId, richMenuId) => {
  await axios.post(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {},
    { headers }
  );
};

const pushMessage = async (userId, message) => {
  await axios.post(
    "https://api.line.me/v2/bot/message/push",
    {
      to: userId,
      messages: [{ type: "text", text: message }],
    },
    { headers }
  );
};

module.exports = { switchRichMenu, pushMessage };
