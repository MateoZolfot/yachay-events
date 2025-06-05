// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para proteger rutas
const protect = (req, res, next) => {
  let token;

  // Los tokens JWT suelen enviarse en el encabezado Authorization con el formato "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Obtener el token del encabezado (quitando "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificar el token
      // jwt.verify() decodifica el token. Si es inválido o expiró, lanzará un error.
      const decoded = jwt.verify(token, JWT_SECRET);

      // 3. Adjuntar el payload del usuario decodificado al objeto request
      // Esto hace que req.user esté disponible en las rutas protegidas.
      // El payload es lo que pusimos al firmar el token en authController.js (ej: { user: { id, email, role } })
      req.user = decoded.user; 

      next(); // Si todo está bien, pasar al siguiente middleware o controlador de ruta
    } catch (error) {
      console.error('Error de autenticación de token:', error.message);
      // Diferentes errores de JWT tienen diferentes mensajes, ej: 'jwt expired', 'invalid signature'
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado. Por favor, inicie sesión de nuevo.' });
      }
      return res.status(401).json({ message: 'Token no válido. Autorización denegada.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No hay token. Autorización denegada.' });
  }
};

// Middleware opcional para restringir el acceso basado en roles
const authorize = (...roles) => { // Recibe una lista de roles permitidos como argumentos
  return (req, res, next) => {
    // Se asume que el middleware 'protect' ya se ejecutó y req.user está disponible
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Usuario no autenticado o rol no definido.' });
    }
    if (!roles.includes(req.user.role)) {
      // Si el rol del usuario no está en la lista de roles permitidos para esta ruta
      return res.status(403).json({ message: `Acceso denegado. Rol '${req.user.role}' no autorizado para este recurso.` });
    }
    next(); // El usuario tiene uno de los roles permitidos, continuar
  };
};


module.exports = { protect, authorize };