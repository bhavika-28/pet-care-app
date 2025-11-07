const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ GET: Fetch todos for a pet (used by both caregiver and owner)
router.get('/', async (req, res) => {
  const { petId } = req.query;

  console.log('Received petId:', petId);
  
  if (!petId) {
    return res.status(400).json({ success: false, message: "Missing petId" });
  }

  try {
    const [todos] = await db.query(
      'SELECT task_id, task, completed, createdAt FROM todos WHERE petId = ? ORDER BY createdAt DESC',
      [petId]
    );
    res.json({ success: true, todos });
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ success: false, message: "Error fetching todos" });
  }
});

// ✅ PUT: Update completed status of a todo
router.put('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { completed } = req.body;

  try {
    await db.query(
      'UPDATE todos SET completed = ? WHERE task_id = ?',
      [completed, taskId]
    );
    res.json({ success: true, message: 'Task updated' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ success: false, message: 'Error updating task' });
  }
});

module.exports = router;
