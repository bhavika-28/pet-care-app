const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/joinGroup
router.post('/joinGroup', async (req, res) => {
  const { enteredCode, userId } = req.body;

  if (!enteredCode || !userId) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  try {
    // 1. Check if groupCode exists
    const [groupResult] = await db.query('SELECT * FROM `groups` WHERE group_code = ?', [enteredCode]);

    if (groupResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // 2. Insert into grp_members
    await db.query(`
      INSERT IGNORE INTO grp_members (group_code, user_id)
      VALUES (?, ?)
    `, [enteredCode, userId]);

    return res.json({ success: true, message: 'Joined group successfully' });

  } catch (err) {
    console.error('Join group error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
