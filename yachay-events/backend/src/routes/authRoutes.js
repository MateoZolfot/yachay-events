// backend/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware'); // <--- Importar el middleware

const router = express.Router();

// Rutas públicas
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Ruta de prueba protegida (solo para usuarios autenticados)
// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  // Gracias al middleware 'protect', req.user está disponible aquí
  // Contiene el payload del token (id, email, role)
  res.json({
    message: 'Datos del usuario autenticado.',
    user: req.user
  });
});

// Ruta de prueba protegida por rol (solo para admin)
// GET /api/auth/admin-test
router.get('/admin-test', protect, authorize('admin'), (req, res) => {
    res.json({
        message: '¡Bienvenido, Administrador! Tienes acceso a esta área secreta.',
        user: req.user
    });
});

// Ruta de prueba protegida por múltiples roles (admin o club_representative)
// GET /api/auth/club-or-admin-test
router.get('/club-or-admin-test', protect, authorize('admin', 'club_representative'), (req, res) => {
    res.json({
        message: 'Acceso concedido a Administradores o Representantes de Club.',
        user: req.user
    });
});


module.exports = router;
