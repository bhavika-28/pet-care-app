// controllers/petController.js
const db = require('../config/db');

// exports.createPet = async (req, res) => {
//     const { name, emoji, userId } = req.body;

//     if (!name || !userId) {
//         return res.status(400).json({ success: false, message: 'Name and userId are required' });
//     }

//     try {
//         // Get groupCode associated with this user
//         const [groupRows] = await db.query(
//             'SELECT group_code FROM `groups` WHERE owner_id = ?',
//             [userId]
//         );

//         if (groupRows.length === 0) {
//             return res.status(404).json({ success: false, message: 'Group not found for this user' });
//         }

//         const groupCode = groupRows[0].group_code;

//         await db.query(
//             'INSERT INTO `pets` (name, emoji, group_code, owner_id) VALUES (?, ?, ?, ?)',
//             [name, emoji || '🐾', groupCode, userId]
//         );

//         res.status(201).json({ success: true, message: 'Pet profile created successfully' });

//     } catch (err) {
//         console.error('Error creating pet:', err);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

exports.createPet = async (req, res) => {
    const { name, emoji, type, breed, userId } = req.body;

    if (!name || !userId || !type || !breed) {
        return res.status(400).json({ success: false, message: 'Name, type, breed, and userId are required' });
    }

    try {
        // Get or create groupCode associated with this user
        let [groupRows] = await db.query(
            'SELECT group_code FROM groups WHERE owner_id = ?',
            [userId]
        );

        let groupCode;
        
        if (groupRows.length === 0) {
            // No group exists, create one automatically
            groupCode = generateGroupCode();
            await db.run(
                'INSERT INTO groups (name, owner_id, group_code) VALUES (?, ?, ?)',
                [`Group ${groupCode}`, userId, groupCode]
            );
            console.log(`Auto-created group ${groupCode} for user ${userId}`);
        } else {
            groupCode = groupRows[0].group_code;
        }

        // Generate unique pet code
        const petCode = generatePetCode();

        const result = await db.run(
            'INSERT INTO pets (name, type, breed, emoji, group_code, pet_code, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, type, breed, emoji || '🐾', groupCode, petCode, userId]
        );

        // Initialize vaccine schedule for the pet
        await initializeVaccineSchedule(result.lastID, type, breed);

        res.status(201).json({ success: true, message: 'Pet profile created successfully', petId: result.lastID });

    } catch (err) {
        console.error('Error creating pet:', err);
        console.error('Error details:', err.message, err.stack);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Initialize vaccine schedule based on pet type and breed
async function initializeVaccineSchedule(petId, type, breed) {
    const vaccines = getVaccineSchedule(type, breed);
    
    for (const vaccine of vaccines) {
        await db.run(
            'INSERT INTO vaccine_schedule (petId, pet_id, vaccine_name, age_years) VALUES (?, ?, ?, ?)',
            [petId, petId, vaccine.name, vaccine.age]
        );
    }
}

// Export for use in other modules
exports.initializeVaccineSchedule = initializeVaccineSchedule;

// Generate group code utility
function generateGroupCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate unique pet code utility
function generatePetCode() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Get vaccine schedule based on pet type and breed
function getVaccineSchedule(type, breed) {
    const schedules = {
        'Dog': [
            { name: 'Rabies', age: 1 },
            { name: 'DHPP', age: 1 },
            { name: 'Bordatella', age: 1 },
            { name: 'Rabies', age: 4 },
            { name: 'DHPP', age: 5 },
            { name: 'Lyme', age: 6 },
            { name: 'Bordatella', age: 7 },
            { name: 'Lepto', age: 8 },
            { name: 'Influenza', age: 9 },
            { name: 'Rabies', age: 10 },
            { name: 'DHPP', age: 11 },
            { name: 'Lyme', age: 12 },
            { name: 'Bordatella', age: 13 },
            { name: 'Lepto', age: 14 },
            { name: 'Influenza', age: 15 }
        ],
        'Cat': [
            { name: 'Rabies', age: 1 },
            { name: 'FVRCP', age: 1 },
            { name: 'FeLV', age: 1 },
            { name: 'Rabies', age: 4 },
            { name: 'FVRCP', age: 5 },
            { name: 'FeLV', age: 6 },
            { name: 'Rabies', age: 10 },
            { name: 'FVRCP', age: 11 },
            { name: 'FeLV', age: 12 }
        ],
        'Rabbit': [
            { name: 'RHDV1', age: 1 },
            { name: 'RHDV2', age: 1 },
            { name: 'RHDV1', age: 2 },
            { name: 'RHDV2', age: 2 }
        ],
        'Bird': [
            { name: 'Polyomavirus', age: 1 },
            { name: 'Psittacosis', age: 1 }
        ]
    };

    return schedules[type] || [];
}

exports.getPetsByGroupCode = async (req, res) => {
    const { groupCode } = req.query;

    if (!groupCode) {
        return res.status(400).json({ success: false, message: 'groupCode is required' });
    }

    try {
        const [pets] = await db.query(
            'SELECT id, name, emoji, type FROM pets WHERE group_code = ?',
            [groupCode]
        );
        
    

        res.status(200).json({ success: true, pets });

    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch pets for a specific user (owned pets)
exports.getPetsByUser = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
    }

    try {
        const [pets] = await db.query(
            'SELECT id, name, emoji, type, breed FROM pets WHERE owner_id = ?',
            [userId]
        );

        res.status(200).json({ success: true, pets });

    } catch (err) {
        console.error('Error fetching pets:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch pets where user is a caretaker (via group_members)
exports.getPetsAsCaretaker = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required' });
    }

    try {
        // Get groups where user is a member
        const [groupRows] = await db.query(
            `SELECT g.group_code FROM group_members gm
             JOIN groups g ON gm.group_id = g.id
             WHERE gm.user_id = ?`,
            [userId]
        );

        if (groupRows.length === 0) {
            return res.status(200).json({ success: true, pets: [] });
        }

        // Get group codes
        const groupCodes = groupRows.map(row => row.group_code);

        // Build query with placeholders
        const placeholders = groupCodes.map(() => '?').join(',');

        // Get pets from those groups (excluding pets owned by this user)
        const [pets] = await db.query(
            `SELECT id, name, emoji, type, breed FROM pets 
             WHERE group_code IN (${placeholders}) AND owner_id != ?`,
            [...groupCodes, userId]
        );

        res.status(200).json({ success: true, pets });

    } catch (err) {
        console.error('Error fetching caretaker pets:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get a single pet by ID
exports.getPetById = async (req, res) => {
    const { petId } = req.params;

    if (!petId) {
        return res.status(400).json({ success: false, message: 'petId is required' });
    }

    try {
        console.log(`Fetching pet with ID: ${petId}`);
        const [pets] = await db.query(
            'SELECT id, name, emoji, type, breed, age, birth_date, gender, weight, color, pet_code FROM pets WHERE id = ?',
            [petId]
        );

        if (pets.length === 0) {
            console.log(`Pet ${petId} not found in database`);
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const pet = pets[0];
        console.log(`Pet found:`, { id: pet.id, name: pet.name, pet_code: pet.pet_code });
        
        // If pet doesn't have a code, generate one automatically
        if (!pet.pet_code) {
            console.log(`Pet ${petId} has no pet_code, generating one...`);
            let petCode;
            let attempts = 0;
            let isUnique = false;

            while (!isUnique && attempts < 10) {
                petCode = generatePetCode();
                // Check if code already exists
                const [existing] = await db.query(
                    'SELECT id FROM pets WHERE pet_code = ?',
                    [petCode]
                );
                if (existing.length === 0) {
                    isUnique = true;
                }
                attempts++;
            }

            if (isUnique) {
                // Update pet with generated code
                await db.run(
                    'UPDATE pets SET pet_code = ? WHERE id = ?',
                    [petCode, petId]
                );
                pet.pet_code = petCode;
                console.log(`✅ Auto-generated pet code ${petCode} for pet ${petId}`);
            } else {
                console.error(`❌ Failed to generate unique pet code for pet ${petId} after ${attempts} attempts`);
            }
        }

        console.log(`Returning pet data:`, { id: pet.id, name: pet.name, pet_code: pet.pet_code });
        res.status(200).json({ success: true, pet: pet });

    } catch (err) {
        console.error('Error fetching pet:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Get a pet by pet code (for caregivers)
exports.getPetByCode = async (req, res) => {
    const { petCode } = req.params;

    if (!petCode) {
        return res.status(400).json({ success: false, message: 'petCode is required' });
    }

    try {
        console.log(`Fetching pet with code: ${petCode}`);
        const [pets] = await db.query(
            'SELECT id, name, emoji, type, breed, age, birth_date, gender, weight, color, pet_code, owner_id, group_code FROM pets WHERE pet_code = ?',
            [petCode.toUpperCase()]
        );

        if (pets.length === 0) {
            console.log(`Pet with code ${petCode} not found in database`);
            return res.status(404).json({ success: false, message: 'Invalid pet code. Please check and try again.' });
        }

        const pet = pets[0];
        console.log(`Pet found by code:`, { id: pet.id, name: pet.name, pet_code: pet.pet_code });
        
        res.status(200).json({ success: true, pet: pet });

    } catch (err) {
        console.error('Error fetching pet by code:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// Update pet details
exports.updatePet = async (req, res) => {
    const { petId } = req.params;
    const { name, type, breed, emoji, age, birth_date, gender, weight, color } = req.body;

    if (!petId) {
        return res.status(400).json({ success: false, message: 'petId is required' });
    }

    try {
        // Build update query dynamically based on provided fields
        const updates = [];
        const params = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (type !== undefined) {
            updates.push('type = ?');
            params.push(type);
        }
        if (breed !== undefined) {
            updates.push('breed = ?');
            params.push(breed);
        }
        if (emoji !== undefined) {
            updates.push('emoji = ?');
            params.push(emoji);
        }
        if (age !== undefined) {
            updates.push('age = ?');
            params.push(age);
        }
        if (birth_date !== undefined) {
            updates.push('birth_date = ?');
            params.push(birth_date);
        }
        if (gender !== undefined) {
            updates.push('gender = ?');
            params.push(gender);
        }
        if (weight !== undefined) {
            updates.push('weight = ?');
            params.push(weight);
        }
        if (color !== undefined) {
            updates.push('color = ?');
            params.push(color);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        
        params.push(petId);
        const query = `UPDATE pets SET ${updates.join(', ')} WHERE id = ?`;
        
        await db.run(query, params);
        
        res.status(200).json({ success: true, message: 'Pet updated successfully' });
    } catch (err) {
        console.error('Error updating pet:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a pet
exports.deletePet = async (req, res) => {
    const { petId } = req.params;

    try {
        await db.run(
            'DELETE FROM pets WHERE id = ?',
            [petId]
        );

        res.status(200).json({ success: true, message: 'Pet deleted successfully' });

    } catch (err) {
        console.error('Error deleting pet:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Generate pet code for a pet that doesn't have one
exports.generatePetCode = async (req, res) => {
    const { petId } = req.params;

    if (!petId) {
        return res.status(400).json({ success: false, message: 'petId is required' });
    }

    try {
        // Check if pet exists and doesn't have a code
        const [pets] = await db.query(
            'SELECT id, pet_code FROM pets WHERE id = ?',
            [petId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const pet = pets[0];
        
        // If pet already has a code, return it
        if (pet.pet_code) {
            return res.status(200).json({ success: true, pet_code: pet.pet_code });
        }

        // Generate a unique pet code
        let petCode;
        let attempts = 0;
        let isUnique = false;

        while (!isUnique && attempts < 10) {
            petCode = generatePetCode();
            // Check if code already exists
            const [existing] = await db.query(
                'SELECT id FROM pets WHERE pet_code = ?',
                [petCode]
            );
            if (existing.length === 0) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ success: false, message: 'Failed to generate unique pet code' });
        }

        // Update pet with generated code
        await db.run(
            'UPDATE pets SET pet_code = ? WHERE id = ?',
            [petCode, petId]
        );

        res.status(200).json({ success: true, pet_code: petCode });

    } catch (err) {
        console.error('Error generating pet code:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

