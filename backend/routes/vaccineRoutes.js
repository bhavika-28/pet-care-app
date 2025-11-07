const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get vaccine schedule for a pet
router.get('/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        
        // First check if pet exists and has type/breed
        const [pets] = await db.query(
            "SELECT id, type, breed FROM pets WHERE id = ?",
            [petId]
        );
        
        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: "Pet not found" });
        }
        
        const pet = pets[0];
        
        // Check if vaccine schedule exists
        const [vaccines] = await db.query(
            "SELECT * FROM vaccine_schedule WHERE petId = ? OR pet_id = ? ORDER BY age_years ASC, vaccine_name ASC",
            [petId, petId]
        );
        
        // If no vaccines exist but pet has type and breed, initialize schedule
        if (vaccines.length === 0 && pet.type && pet.breed) {
            const { initializeVaccineSchedule } = require('../controllers/petController');
            await initializeVaccineSchedule(petId, pet.type, pet.breed);
            
            // Fetch again after initialization
            const [newVaccines] = await db.query(
                "SELECT * FROM vaccine_schedule WHERE petId = ? OR pet_id = ? ORDER BY age_years ASC, vaccine_name ASC",
                [petId, petId]
            );
            return res.json({ success: true, vaccines: newVaccines });
        }
        
        res.json({ success: true, vaccines });
    } catch (err) {
        console.error('Error fetching vaccine schedule:', err);
        res.status(500).json({ success: false, message: "Error fetching vaccine schedule" });
    }
});

// Update vaccine completion status
router.put('/:vaccineId', async (req, res) => {
    try {
        const { vaccineId } = req.params;
        const { completed, completed_date, notes } = req.body;
        
        let updateQuery = "UPDATE vaccine_schedule SET completed = ?";
        const params = [completed];
        
        if (completed_date) {
            updateQuery += ", completed_date = ?";
            params.push(completed_date);
        } else if (completed === 0) {
            updateQuery += ", completed_date = NULL";
        }
        
        if (notes !== undefined) {
            updateQuery += ", notes = ?";
            params.push(notes);
        }
        
        updateQuery += " WHERE id = ?";
        params.push(vaccineId);
        
        await db.run(updateQuery, params);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating vaccine:', err);
        res.status(500).json({ success: false, message: "Error updating vaccine" });
    }
});

module.exports = router;

