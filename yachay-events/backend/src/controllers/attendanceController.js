// backend/src/controllers/attendanceController.js
const db = require('../config/db');

// @desc    Registrar la asistencia de un estudiante a un evento
// @route   POST /api/events/:eventId/attend
// @access  Private (student)
exports.registerAttendance = async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const userId = req.user.id; // Del token JWT (estudiante logueado)
  const userRole = req.user.role;

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido.' });
  }

  if (userRole !== 'student') {
    return res.status(403).json({ message: 'Acción no autorizada. Solo los estudiantes pueden registrar asistencia.' });
  }

  try {
    // 1. Verificar que el evento existe y pertenece a un club aprobado
    const eventQuery = `
        SELECT e.id, e.date_time
        FROM Events e
        JOIN Clubs c ON e.club_id = c.id
        WHERE e.id = $1 AND c.is_approved = TRUE;
    `;
    const eventResult = await db.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado o no disponible para registro.' });
    }
    
    // 2. Verificar si el evento ya pasó (opcional, pero buena práctica)
    const eventDetails = eventResult.rows[0];
    if (new Date(eventDetails.date_time) < new Date()) {
        // return res.status(400).json({ message: 'No puedes registrarte a un evento que ya ha ocurrido.' });
        // Por ahora, permitiremos registrarse a eventos pasados para facilitar pruebas.
        // En producción, esta validación sería importante.
    }


    // 3. Intentar registrar la asistencia
    // La restricción UNIQUE (user_id, event_id) en la BD manejará los duplicados.
    const newAttendanceQuery = `
      INSERT INTO EventAttendances (user_id, event_id)
      VALUES ($1, $2)
      RETURNING id, registration_time;
    `;
    const newAttendance = await db.query(newAttendanceQuery, [userId, eventId]);

    res.status(201).json({
      message: 'Asistencia registrada exitosamente.',
      attendance: newAttendance.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar la asistencia:', error);
    if (error.code === '23505') { // Violación de restricción UNIQUE
      return res.status(409).json({ message: 'Ya estás registrado en este evento.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al registrar la asistencia.' });
  }
};

// @desc    Obtener la lista de asistentes para un evento específico
// @route   GET /api/events/:eventId/attendees
// @access  Private (club_representative del club dueño del evento, o admin)
exports.getEventAttendees = async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido.' });
  }

  try {
    // 1. Verificar que el evento existe
    const eventClubQuery = `
        SELECT e.id, c.user_id as club_owner_id 
        FROM Events e 
        JOIN Clubs c ON e.club_id = c.id 
        WHERE e.id = $1;
    `;
    const eventResult = await db.query(eventClubQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }
    const eventDetails = eventResult.rows[0];

    // 2. Verificar autorización: solo el representante del club dueño del evento o un admin.
    if (eventDetails.club_owner_id !== requestingUserId && requestingUserRole !== 'admin') {
      return res.status(403).json({ message: 'Acción no autorizada. No tienes permiso para ver los asistentes de este evento.' });
    }

    // 3. Obtener los asistentes
    const attendeesQuery = `
      SELECT u.id, u.name, u.email, ea.registration_time
      FROM EventAttendances ea
      JOIN Users u ON ea.user_id = u.id
      WHERE ea.event_id = $1
      ORDER BY ea.registration_time ASC;
    `;
    const attendees = await db.query(attendeesQuery, [eventId]);

    res.status(200).json(attendees.rows);

  } catch (error) {
    console.error('Error al obtener los asistentes del evento:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener los asistentes.' });
  }
};

// @desc    Obtener los eventos a los que un estudiante se ha registrado
// @route   GET /api/attendance/my-attended-events (cambiado de /api/users/me/attended-events)
// @access  Private (student)
exports.getMyAttendedEvents = async (req, res) => {
  const userId = req.user.id; // Estudiante logueado

  try {
    const myEventsQuery = `
      SELECT e.id, e.title, e.description, e.date_time, e.location, c.name as club_name, ea.registration_time
      FROM EventAttendances ea
      JOIN Events e ON ea.event_id = e.id
      JOIN Clubs c ON e.club_id = c.id
      WHERE ea.user_id = $1 AND c.is_approved = TRUE
      ORDER BY e.date_time DESC;
    `;
    const myEvents = await db.query(myEventsQuery, [userId]);

    res.status(200).json(myEvents.rows);

  } catch (error) {
    console.error('Error al obtener mis eventos registrados:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener mis eventos.' });
  }
};