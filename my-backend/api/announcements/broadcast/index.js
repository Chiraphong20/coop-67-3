// ✅ Broadcast Announcement API
app.post('/api/announcements/broadcast', (req, res) => {
  const { title, detail, date, image } = req.body;

  if (!title || !detail || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('📢 ประกาศใหม่');
  console.log('หัวข้อ:', title);
  console.log('เนื้อหา:', detail);
  console.log('วันที่:', date);
  if (image) {
    console.log('รูปภาพ:', image.substring(0, 100) + '...'); 
  }

  const mockUsers = ['user1@example.com', 'user2@example.com'];
  mockUsers.forEach((user) => {
    console.log(`✅ ส่งประกาศถึง ${user}: "${title}"`);
  });

  res.json({ message: 'Broadcast sent to all users' });
});
