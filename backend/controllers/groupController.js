const db = require('../config/db');

exports.checkOrCreateGroup = async (req, res) => {
    const { userId } = req.body;
    console.log('Received request to check or create group with userId:', userId);

    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
        console.log('Running SELECT query...');
        const [result] = await db.query('SELECT * FROM `groups` WHERE owner_id = ?', [userId]);
        console.log('SELECT query completed.', result);

        if (result.length > 0) {
            // Group already exists
            console.log('Group already exists:', result[0].group_code);
            return res.status(200).json({ success: true, groupCode: result[0].group_code });
        }

        // No group yet, generate new group code
        const groupCode = generateGroupCode();
        console.log('Generated new group code:', groupCode);

        const insertResult = await db.run(
            'INSERT INTO `groups` (name, owner_id, group_code) VALUES (?, ?, ?)',
            [`Group ${groupCode}`, userId, groupCode]
        );

        console.log(`New group created with code ${groupCode} for owner ${userId}.`);
        res.status(200).json({ success: true, groupCode });

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Utility function
function generateGroupCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
