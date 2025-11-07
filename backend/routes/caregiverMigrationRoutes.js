const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/caregiver/migrate - Migrate caregivers from localStorage to database
// This endpoint can be called to ensure all caregivers in localStorage are also in the database
router.post('/migrate', async (req, res) => {
    const { userId, petIds } = req.body;

    if (!userId || !petIds || !Array.isArray(petIds)) {
        return res.status(400).json({ success: false, message: 'userId and petIds array are required' });
    }

    try {
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const migrated = [];
        const errors = [];

        for (const petId of petIds) {
            const petIdInt = parseInt(petId, 10);
            if (isNaN(petIdInt)) continue;

            try {
                // Get pet info
                const [pets] = await db.query(
                    'SELECT id, owner_id, group_code FROM pets WHERE id = ?',
                    [petIdInt]
                );

                if (pets.length === 0) {
                    errors.push({ petId: petIdInt, error: 'Pet not found' });
                    continue;
                }

                const pet = pets[0];

                // Skip if user is the owner
                if (pet.owner_id === userIdInt) {
                    continue;
                }

                // Get group_id
                if (!pet.group_code) {
                    errors.push({ petId: petIdInt, error: 'Pet has no group_code' });
                    continue;
                }

                const [groups] = await db.query(
                    'SELECT id FROM groups WHERE group_code = ?',
                    [pet.group_code]
                );

                if (groups.length === 0) {
                    errors.push({ petId: petIdInt, error: 'Group not found' });
                    continue;
                }

                const groupId = groups[0].id;

                // Check if already in database
                const [existing] = await db.query(
                    'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
                    [groupId, userIdInt]
                );

                if (existing.length === 0) {
                    // Add to database
                    await db.run(
                        'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                        [groupId, userIdInt, 'caregiver']
                    );
                    migrated.push(petIdInt);
                    console.log(`✅ Migrated caregiver ${userIdInt} for pet ${petIdInt}`);
                }
            } catch (err) {
                console.error(`Error migrating pet ${petIdInt}:`, err);
                errors.push({ petId: petIdInt, error: err.message });
            }
        }

        res.status(200).json({
            success: true,
            migrated,
            errors,
            message: `Migrated ${migrated.length} caregiver relationships`
        });

    } catch (err) {
        console.error('Error in migration:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;

