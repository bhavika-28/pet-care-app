const express = require('express');
const router = express.Router();
const db = require('../config/db');  // your MySQL pool/connection

// Get all todos for a pet (support both /list/:petId and /:petId for compatibility)
router.get('/list/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        console.log('GET /api/todos/list/', petId);
        const [todos] = await db.query("SELECT id, task, description, assigned_to, reminder_time, completed FROM todos WHERE petId = ? OR pet_id = ? ORDER BY created_at DESC", [petId, petId]);
        res.json({ success: true, todos });
    } catch (err) {
        console.error('Error in /list/:petId', err);
        res.status(500).json({ success: false, message: "Error fetching todos" });
    }
});

router.get('/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        console.log('GET /api/todos/', petId);
        const [todos] = await db.query("SELECT id, task, description, assigned_to, reminder_time, completed FROM todos WHERE petId = ? OR pet_id = ? ORDER BY created_at DESC", [petId, petId]);
        res.json({ success: true, todos });
    } catch (err) {
        console.error('Error in /:petId', err);
        res.status(500).json({ success: false, message: "Error fetching todos" });
    }
});

// Add new todo for a pet
router.post('/', async (req, res) => {
    try {
        const { petId, task, description, assigned_to, reminder_time, repeat_type, repeat_interval, repeat_days } = req.body;
        const result = await db.run("INSERT INTO todos (title, petId, task, description, assigned_to, reminder_time, repeat_type, repeat_interval, repeat_days, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [task, petId, task, description, assigned_to, reminder_time, repeat_type || 'none', repeat_interval || 1, repeat_days, repeat_type !== 'none']);
        res.json({ success: true, todoId: result.lastID });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error adding todo" });
    }
});

// // Toggle todo status
// router.put('/:todoId', async (req, res) => {
//     try {
//         const { todoId } = req.params;
//         const { isCompleted } = req.body;
//         await db.query("UPDATE todos SET isCompleted = ? WHERE task_id = ?", [isCompleted, todoId]);
//         res.json({ success: true });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: "Error updating todo" });
//     }
// });

// Get todos with reminders (for notifications)
router.get('/reminders/:petId', async (req, res) => {
    try {
        const { petId } = req.params;
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        // Match HH:MM stored values; also handle HH:MM:SS by truncating via substr
        const [todos] = await db.query(
            "SELECT id, task, description, assigned_to, reminder_time FROM todos WHERE (petId = ? OR pet_id = ?) AND substr(reminder_time,1,5) <= ? AND completed = 0",
            [petId, petId, currentTime]
        );
        res.json({ success: true, todos });
    } catch (err) {
        console.error('Reminder check error:', err);
        res.status(500).json({ success: false, message: "Error fetching reminders" });
    }
});

// Update todo (completion status, task, description, assigned_to, or reminder_time)
router.put('/:todoId', async (req, res) => {
    try {
        const { todoId } = req.params;
        const { completed, task, description, assigned_to, reminder_time } = req.body;
        
        console.log('Backend received update request:', { todoId, completed, task, description, assigned_to, reminder_time });
        
        let updateQuery = "UPDATE todos SET ";
        let updateValues = [];
        let updateFields = [];
        
        if (completed !== undefined) {
            updateFields.push("completed = ?");
            updateValues.push(completed);
        }
        
        if (task !== undefined) {
            updateFields.push("task = ?");
            updateValues.push(task);
        }
        
        if (description !== undefined) {
            updateFields.push("description = ?");
            updateValues.push(description);
        }
        
        if (assigned_to !== undefined) {
            updateFields.push("assigned_to = ?");
            updateValues.push(assigned_to);
        }
        
        if (reminder_time !== undefined) {
            updateFields.push("reminder_time = ?");
            updateValues.push(reminder_time);
        }
        
        if (updateFields.length === 0) {
            console.log('No fields to update');
            return res.status(400).json({ success: false, message: "No fields to update" });
        }
        
        updateQuery += updateFields.join(", ") + " WHERE id = ?";
        updateValues.push(todoId);
        
        console.log('Executing query:', updateQuery, 'with values:', updateValues);
        
        await db.run(updateQuery, updateValues);
        console.log('Update successful');
        res.json({ success: true });
    } catch (err) {
        console.error('Backend update error:', err);
        res.status(500).json({ success: false, message: "Error updating todo" });
    }
});

// Delete todo
router.delete('/:todoId', async (req, res) => {
    try {
        const { todoId } = req.params;
        await db.run("DELETE FROM todos WHERE id = ?", [todoId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting todo" });
    }
});

module.exports = router;
