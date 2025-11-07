const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET connected members based on pet relationships
router.get('/connected-members', async (req, res) => {
    const { userId, caregiverPetIds } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
    }

    try {
        // Convert userId to integer
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const connectedMembers = [];
        const memberPetMap = {}; // Map to store which pets connect to which members

        // Parse caregiverPetIds if provided (comma-separated string)
        const petIds = caregiverPetIds ? caregiverPetIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];

        // If user is a caregiver (has caregiverPetIds), find owners of those pets
        if (petIds.length > 0) {
            const placeholders = petIds.map(() => '?').join(',');
            const [petOwners] = await db.query(
                `SELECT DISTINCT p.id as pet_id, p.name as pet_name, p.emoji as pet_emoji,
                        u.id as user_id, u.username, u.email
                 FROM pets p
                 JOIN users u ON p.owner_id = u.id
                 WHERE p.id IN (${placeholders}) AND p.owner_id != ?`,
                [...petIds, userIdInt]
            );

            petOwners.forEach(row => {
                const memberKey = row.user_id;
                if (!memberPetMap[memberKey]) {
                    memberPetMap[memberKey] = {
                        user_id: row.user_id,
                        username: row.username || row.email,
                        email: row.email,
                        pets: []
                    };
                    connectedMembers.push(memberPetMap[memberKey]);
                }
                // Check if pet is already in the list
                const petExists = memberPetMap[memberKey].pets.find(p => p.id === row.pet_id);
                if (!petExists) {
                    memberPetMap[memberKey].pets.push({
                        id: row.pet_id,
                        name: row.pet_name,
                        emoji: row.pet_emoji
                    });
                }
            });
        }

        // If user owns pets, find caregivers who have those pets
        // Get user's owned pets
        const [ownedPets] = await db.query(
            'SELECT id, name, emoji FROM pets WHERE owner_id = ?',
            [userIdInt]
        );

        if (ownedPets.length > 0) {
            const ownedPetIds = ownedPets.map(p => p.id);
            const placeholders = ownedPetIds.map(() => '?').join(',');

            console.log(`🔍 Looking for caregivers of owned pets: ${ownedPetIds.join(', ')}`);
            
            // Find caregivers via group_members for pets that share the same group_code
            const [groupMembers] = await db.query(
                `SELECT DISTINCT u.id as user_id, u.username, u.email, p.id as pet_id, p.name as pet_name, p.emoji as pet_emoji
                 FROM pets p
                 JOIN groups g ON p.group_code = g.group_code
                 JOIN group_members gm ON g.id = gm.group_id
                 JOIN users u ON gm.user_id = u.id
                 WHERE p.id IN (${placeholders}) AND u.id != ?`,
                [...ownedPetIds, userIdInt]
            );
            
            console.log(`👥 Found ${groupMembers.length} caregivers for owned pets`);

            groupMembers.forEach(row => {
                const memberKey = row.user_id;
                if (!memberPetMap[memberKey]) {
                    memberPetMap[memberKey] = {
                        user_id: row.user_id,
                        username: row.username || row.email,
                        email: row.email,
                        pets: []
                    };
                    connectedMembers.push(memberPetMap[memberKey]);
                }
                // Check if pet is already in the list
                const petExists = memberPetMap[memberKey].pets.find(p => p.id === row.pet_id);
                if (!petExists) {
                    memberPetMap[memberKey].pets.push({
                        id: row.pet_id,
                        name: row.pet_name,
                        emoji: row.pet_emoji
                    });
                }
            });
        }

        res.status(200).json({ success: true, members: connectedMembers });

    } catch (err) {
        console.error('Error fetching connected members:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;

