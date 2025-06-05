// backend/src/routes/attendanceRoutes.js
const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router(); // Router simple

// Un router anidado para rutas específicas de eventos
const eventSpecificRouter = express.Router({ mergeParams: true });

// Rutas bajo /api/events/:eventId/
eventSpecificRouter.post('/attend', protect, authorize('student'), attendanceController.registerAttendance);
eventSpecificRouter.get('/attendees', protect, attendanceController.getEventAttendees);


// Rutas para el usuario logueado
// GET /api/attendance/my-events (Ruta simplificada)
router.get('/my-events', protect, authorize('student'), attendanceController.getMyAttendedEvents);


module.exports = {
    eventAttendanceRouter: eventSpecificRouter,
    userAttendanceRouter: router 
};