// routes/cgHealthRecordsRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/cg/health-records/:petId
router.get('/:petId', async (req, res) => {
  const { petId } = req.params;

  try {
    const [records] = await db.query(
      'SELECT record_id, type, name, notes, date, vet_clinic FROM health_records WHERE petId = ? ORDER BY date DESC',
      [petId]
    );
    res.json({ success: true, records });
  } catch (err) {
    console.error('Error fetching caregiver health records:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
