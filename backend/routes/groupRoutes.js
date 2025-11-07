const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');


router.post('/checkOrCreateGroup', groupController.checkOrCreateGroup);

module.exports = router;
