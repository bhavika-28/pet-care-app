const express = require('express');
const router = express.Router();
const { signup, login, changePassword, updateUsername, getUser } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/change-password', changePassword);
router.get('/user/:userId', getUser); // Get user by ID
router.put('/username', updateUsername);

// Debug route to verify router is working
router.get('/username/test', (req, res) => {
    res.json({ message: 'Auth routes are working' });
});

module.exports = router;
