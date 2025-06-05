// backend/src/server.js
const express = require('express');
const cors = require('cors'); // <--- 1. Importar cors
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const eventRoutes = require('./routes/eventRoutes');
const { userAttendanceRouter } = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
// 2. Usar cors ANTES de las rutas
// Esto permitirá todas las solicitudes cross-origin. Para producción,
// podrías querer configurarlo de forma más restrictiva:
// app.use(cors({ origin: 'http://tu-dominio-frontend.com' }));
app.use(cors());

app.use(express.json()); // Para parsear JSON bodies

// Rutas de API de prueba
app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de YachayEvents!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Conexión a la base de datos exitosa.',
      currentTime: result.rows[0].now,
    });
  } catch (error) {
    console.error('Error en /api/db-test:', error);
    res.status(500).json({ message: 'Error al conectar con la base de datos.', error: error.message });
  }
});

// Rutas principales de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/attendance', userAttendanceRouter);

async function startServer() {
  try {
    await db.testDbConnection();
    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en el puerto ${PORT}`);
      console.log(`URL de la base de datos (desde env): ${process.env.DATABASE_URL}`);
      console.log(`Para probar la API base, visita: http://localhost:${PORT}/api`);
      console.log(`Para probar la conexión a BD, visita: http://localhost:${PORT}/api/db-test`);
      console.log('Endpoints de Autenticación disponibles en: /api/auth');
      console.log('Endpoints de Clubes disponibles en: /api/clubs');
      console.log('Endpoints de Eventos disponibles en: /api/events');
      console.log('Endpoints de Asistencia (usuario) disponibles en: /api/attendance');
      console.log('Endpoints de Asistencia (evento) disponibles anidados en: /api/events/:eventId/');
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor debido a un error con la base de datos:", error);
    process.exit(1); 
  }
}

startServer();