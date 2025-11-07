const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/caregiver/add - Add a caregiver to a pet via pet code
router.post('/add', async (req, res) => {
    const { userId, petId } = req.body;

    if (!userId || !petId) {
        return res.status(400).json({ success: false, message: 'userId and petId are required' });
    }

    try {
        const userIdInt = parseInt(userId, 10);
        const petIdInt = parseInt(petId, 10);

        if (isNaN(userIdInt) || isNaN(petIdInt)) {
            return res.status(400).json({ success: false, message: 'Invalid userId or petId' });
        }

        // Get pet info to find group_code
        const [pets] = await db.query(
            'SELECT id, owner_id, group_code FROM pets WHERE id = ?',
            [petIdInt]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const pet = pets[0];

        // Check if user is already the owner
        if (pet.owner_id === userIdInt) {
            return res.status(400).json({ success: false, message: 'You are already the owner of this pet' });
        }

        // Get or find the group for this pet
        let groupId;
        if (pet.group_code) {
            const [groups] = await db.query(
                'SELECT id FROM groups WHERE group_code = ?',
                [pet.group_code]
            );
            if (groups.length > 0) {
                groupId = groups[0].id;
            }
        }

        // If no group exists, create one
        if (!groupId) {
            // This shouldn't happen, but handle it
            return res.status(500).json({ success: false, message: 'Pet group not found' });
        }

        // Check if user is already a member
        const [existing] = await db.query(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userIdInt]
        );

        if (existing.length > 0) {
            return res.status(200).json({ success: true, message: 'Already a caregiver for this pet' });
        }

        // Add user to group_members
        await db.run(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [groupId, userIdInt, 'caregiver']
        );

        res.status(200).json({ success: true, message: 'Successfully added as caregiver' });

    } catch (err) {
        console.error('Error adding caregiver:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// DELETE /api/caregiver/remove - Remove a caregiver from a pet
router.delete('/remove', async (req, res) => {
    const { userId, petId, removedByUserId } = req.body;

    if (!userId || !petId) {
        return res.status(400).json({ success: false, message: 'userId and petId are required' });
    }

    try {
        const userIdInt = parseInt(userId, 10);
        const petIdInt = parseInt(petId, 10);
        const removedByUserIdInt = removedByUserId ? parseInt(removedByUserId, 10) : null;

        if (isNaN(userIdInt) || isNaN(petIdInt)) {
            return res.status(400).json({ success: false, message: 'Invalid userId or petId' });
        }

        // Get pet info
        const [pets] = await db.query(
            'SELECT id, owner_id, group_code FROM pets WHERE id = ?',
            [petIdInt]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const pet = pets[0];

        // If removedByUserId is provided, check if they're the owner (owner removing someone else)
        if (removedByUserIdInt && removedByUserIdInt !== userIdInt) {
            // Someone else is trying to remove this user - must be the owner
            if (pet.owner_id !== removedByUserIdInt) {
                return res.status(403).json({ success: false, message: 'Only the owner can remove caregivers' });
            }
        }
        // If no removedByUserId or it's the same as userId, it's self-removal (allowed)

        // Get group_id
        if (!pet.group_code) {
            return res.status(404).json({ success: false, message: 'Pet group not found' });
        }

        const [groups] = await db.query(
            'SELECT id FROM groups WHERE group_code = ?',
            [pet.group_code]
        );

        if (groups.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const groupId = groups[0].id;

        // Remove from group_members
        console.log(`🗑️ Attempting to remove user ${userIdInt} from group ${groupId} for pet ${petIdInt}`);
        
        const result = await db.run(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userIdInt]
        );

        console.log(`📊 DELETE result: ${result.changes} rows affected`);

        // If not found in database, still return success (might only be in localStorage)
        if (result.changes === 0) {
            console.log(`⚠️ Caregiver not found in database, but allowing removal (may only exist in localStorage)`);
            // Return success anyway - the frontend will remove from localStorage
            return res.status(200).json({ success: true, message: 'Removed from database (if existed)' });
        }

        res.status(200).json({ success: true, message: 'Successfully removed caregiver' });

    } catch (err) {
        console.error('Error removing caregiver:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;

