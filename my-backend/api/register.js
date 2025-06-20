import { setRichMenu } from '../lib/line';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ error: 'Missing userId or role' });
  }

  try {
    let richMenuId;

    switch (role) {
      case 'resident':
        richMenuId = process.env.RICH_MENU_RESIDENT;
        break;
      case 'juristic':
        richMenuId = process.env.RICH_MENU_JURISTIC;
        break;
      case 'technician':
        richMenuId = process.env.RICH_MENU_TECHNICIAN;
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

    await setRichMenu(userId, richMenuId);

    return res.status(200).json({ message: 'Rich menu updated' });
  } catch (error) {
    console.error('RichMenu error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
