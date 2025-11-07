const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming you're using MySQL or another DB

// Get pets for a specific group code
router.get('/', async (req, res) => {
    const { groupCode } = req.query;

    if (!groupCode) {
        return res.status(400).json({ success: false, message: "Group code is required." });
    }

    try {
        // Query to fetch pets based on group code
        const query = 'SELECT id, name, emoji, type FROM pets WHERE group_code = ?';
        const pets = await db.query(query, [groupCode]);

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: "No pets found for this group." });
        }

        res.status(200).json({ success: true, pets });
    } catch (error) {
        console.error("Error fetching pets:", error);
        res.status(500).json({ success: false, message: "Error fetching pets." });
    }
});

module.exports = router;
