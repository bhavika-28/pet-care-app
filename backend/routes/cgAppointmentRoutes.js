const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: Fetch upcoming appointments for a pet
router.get('/', async (req, res) => {
  const { petId } = req.query;

  if (!petId) {
    return res.status(400).json({ success: false, message: "Missing petId" });
  }

  try {
    const [appointments] = await db.query(
      `SELECT appointment_id, datetime, type, details, caregiverId
       FROM appointments
       WHERE petId = ? AND datetime >= CURDATE() 
       ORDER BY datetime ASC`,
      [petId]
    );
    res.json({ success: true, appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT: Mark appointment as taken by caregiver
router.put('/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  const { caregiverId } = req.body;

  if (!caregiverId) {
    return res.status(400).json({ success: false, message: "Missing caregiverId" });
  }

  try {
    await db.query(
      `UPDATE appointments SET caregiverId = ? WHERE appointment_id = ?`,
      [caregiverId, appointmentId]
    );
    res.json({ success: true, message: "Appointment marked as taken" });
  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

module.exports = router;
