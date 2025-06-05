// backend/src/routes/clubRoutes.js
const express = require('express');
const clubController = require('../controllers/clubController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { processFormData } = require('../middleware/uploadMiddleware'); // <--- Cambiado

const router = express.Router();

router.post('/', protect, processFormData, clubController.registerClub); // <--- Usar processFormData
router.put('/:id', protect, processFormData, clubController.updateClub);   // <--- Usar processFormData

router.get('/', clubController.getAllClubs);
router.get('/:id', clubController.getClubById);
router.delete('/:id', protect, authorize('admin'), clubController.deleteClub);

module.exports = router;