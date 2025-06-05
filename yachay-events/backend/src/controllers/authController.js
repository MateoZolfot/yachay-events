// backend/src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // <--- Importar jsonwebtoken

// Leer el secreto JWT desde las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Error crítico: La variable de entorno JWT_SECRET no está definida.");
  // En un entorno real, podrías querer que la aplicación no inicie si falta el secreto.
  // process.exit(1); 
}


// --- (La función registerUser que ya teníamos permanece igual aquí arriba) ---
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios (nombre, email, contraseña, rol).' });
  }
  const allowedRoles = ['student', 'club_representative', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${allowedRoles.join(', ')}.` });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Formato de correo electrónico inválido.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const userExists = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUserQuery = `
      INSERT INTO Users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at;
    `;
    const newUser = await db.query(newUserQuery, [name, email, passwordHash, role]);
    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    if (error.code === '23505') {
        return res.status(409).json({ message: 'El correo electrónico ya está registrado (error de BD).' });
    }
    res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
  }
};
// --- (Fin de la función registerUser) ---


// Nueva función para iniciar sesión
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Validaciones básicas
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
    // 2. Buscar al usuario por email
    const userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const user = userResult.rows[0];

    // 3. Comparar la contraseña proporcionada con la hasheada almacenada
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 4. Si las credenciales son correctas, generar un JWT
    // El "payload" del token puede contener información que quieras que esté disponible
    // sin tener que consultar la base de datos en cada solicitud (ej. id de usuario, rol).
    // ¡No incluyas información sensible como contraseñas en el payload!
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
        // puedes añadir name: user.name si lo necesitas frecuentemente
      }
    };

    // Firmar el token
    // El token expirará en 1 hora ('1h'). Puedes ajustarlo según tus necesidades ('7d', '30m', etc.)
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }, // Tiempo de expiración del token
      (err, token) => {
        if (err) throw err; // Si hay un error al firmar, lánzalo
        res.json({
          message: 'Inicio de sesión exitoso.',
          token: token,
          user: { // Opcional: devolver algunos datos del usuario
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
  }
};