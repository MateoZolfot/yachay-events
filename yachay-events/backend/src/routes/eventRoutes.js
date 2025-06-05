// backend/src/routes/eventRoutes.js
const express = require('express');
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { eventAttendanceRouter } = require('./attendanceRoutes');
const { processFormData } = require('../middleware/uploadMiddleware'); // <--- Cambiado

const router = express.Router();

router.use('/:eventId', eventAttendanceRouter);

router.post('/', protect, processFormData, eventController.createEvent); // <--- Usar processFormData
router.put('/:id', protect, processFormData, eventController.updateEvent);   // <--- Usar processFormData

// ... (otras rutas de evento) ...
router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.delete('/:id', protect, eventController.deleteEvent);

module.exports = router;