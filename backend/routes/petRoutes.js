// routes/petRoutes.js
const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');

router.post('/create', petController.createPet);
router.get('/', petController.getPetsByGroupCode);
router.get('/user', petController.getPetsByUser); // Fetch pets for user (owned)
router.get('/caretaker', petController.getPetsAsCaretaker); // Fetch pets where user is caretaker
router.get('/code/:petCode', petController.getPetByCode); // Get pet by pet code (for caregivers) - MUST come before /:petId
router.post('/:petId/generate-code', petController.generatePetCode); // Generate pet code if missing - MUST come before /:petId
router.get('/:petId', petController.getPetById); // Get a single pet by ID
router.put('/:petId', petController.updatePet);
router.delete('/:petId', petController.deletePet); // Delete a specific pet by ID

module.exports = router;
