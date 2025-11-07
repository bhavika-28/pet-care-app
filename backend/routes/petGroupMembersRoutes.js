const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET group members for a specific pet (owner + caregivers via pet code)
router.get('/pet/:petId/members', async (req, res) => {
    const { petId } = req.params;

    if (!petId) {
        return res.status(400).json({ success: false, message: 'petId is required' });
    }

    try {
        const petIdInt = parseInt(petId, 10);
        if (isNaN(petIdInt)) {
            return res.status(400).json({ success: false, message: 'Invalid petId' });
        }

        const members = [];

        // Get pet info
        const [pets] = await db.query(
            'SELECT id, name, owner_id, group_code FROM pets WHERE id = ?',
            [petIdInt]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const pet = pets[0];

        // Get owner
        if (pet.owner_id) {
            const [owners] = await db.query(
                'SELECT id, username, email FROM users WHERE id = ?',
                [pet.owner_id]
            );
            if (owners.length > 0) {
                members.push({
                    ...owners[0],
                    role: 'owner'
                });
            }
        }

        // Get caregivers via group_members (if pet has group_code)
        if (pet.group_code) {
            console.log(`🔍 Looking for caregivers for pet ${petIdInt} with group_code: ${pet.group_code}`);
            
            // First, get the group_id
            const [groups] = await db.query(
                'SELECT id FROM groups WHERE group_code = ?',
                [pet.group_code]
            );
            
            if (groups.length > 0) {
                const groupId = groups[0].id;
                console.log(`📋 Found group_id: ${groupId} for group_code: ${pet.group_code}`);
                
                const [groupMembers] = await db.query(
                    `SELECT DISTINCT u.id, u.username, u.email, gm.role
                     FROM users u
                     JOIN group_members gm ON u.id = gm.user_id
                     WHERE gm.group_id = ? AND u.id != ?`,
                    [groupId, pet.owner_id]
                );

                console.log(`👥 Found ${groupMembers.length} caregivers in group_members`);
                
                groupMembers.forEach(member => {
                    console.log(`  - Caregiver: ${member.username || member.email} (ID: ${member.id})`);
                    members.push({
                        ...member,
                        role: member.role || 'caregiver'
                    });
                });
            } else {
                console.log(`⚠️ No group found for group_code: ${pet.group_code}`);
            }
        } else {
            console.log(`⚠️ Pet ${petIdInt} has no group_code`);
        }

        res.status(200).json({ success: true, members, pet: { id: pet.id, name: pet.name } });

    } catch (err) {
        console.error('Error fetching pet group members:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;

