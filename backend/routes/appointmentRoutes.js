const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all appointments for a pet
router.get('/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        const [appointments] = await db.query(
            "SELECT appointment_id, type, details, datetime, completed FROM appointments WHERE (petId = ? OR pet_id = ?) ORDER BY datetime ASC", 
            [petId, petId]
        );
        res.json({ success: true, appointments });
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ success: false, message: "Error fetching appointments" });
    }
});

// Add a new appointment
router.post('/', async (req, res) => {
    try {
        const { petId, type, details, datetime } = req.body;
        const result = await db.run(
            "INSERT INTO appointments (petId, type, details, datetime) VALUES (?, ?, ?, ?)",
            [petId, type, details, datetime]
        );
        res.json({ success: true, appointmentId: result.lastID });
    } catch (err) {
        console.error('Error adding appointment:', err);
        res.status(500).json({ success: false, message: "Error adding appointment" });
    }
});

// Update an appointment
router.put('/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { type, details, datetime } = req.body;
        
        let updateQuery = "UPDATE appointments SET ";
        let updateValues = [];
        let updateFields = [];
        
        if (type !== undefined) {
            updateFields.push("type = ?");
            updateValues.push(type);
        }
        
        if (details !== undefined) {
            updateFields.push("details = ?");
            updateValues.push(details);
        }
        
        if (datetime !== undefined) {
            updateFields.push("datetime = ?");
            updateValues.push(datetime);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }
        
        updateQuery += updateFields.join(", ") + " WHERE appointment_id = ?";
        updateValues.push(appointmentId);
        
        await db.run(updateQuery, updateValues);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating appointment:', err);
        res.status(500).json({ success: false, message: "Error updating appointment" });
    }
});

// Toggle appointment completion
router.put('/:appointmentId/toggle', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        await db.run("UPDATE appointments SET completed = NOT completed WHERE appointment_id = ?", [appointmentId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error toggling appointment:', err);
        res.status(500).json({ success: false, message: "Error toggling appointment" });
    }
});

// Delete an appointment
router.delete('/:appointmentId', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        await db.run("DELETE FROM appointments WHERE appointment_id = ?", [appointmentId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting appointment:', err);
        res.status(500).json({ success: false, message: "Error deleting appointment" });
    }
});

module.exports = router;
