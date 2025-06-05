// backend/src/config/db.js
const { Pool } = require('pg');

// La variable de entorno DATABASE_URL la definimos en docker-compose.yml
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si estás usando SSL para una base de datos en producción, lo configurarías aquí.
  // Para desarrollo local con Docker, usualmente no es necesario.
  // ssl: {
  //   rejectUnauthorized: false // Solo para desarrollo si tienes problemas de SSL
  // }
});

// Función para probar la conexión
async function testDbConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa a PostgreSQL!');
    const res = await client.query('SELECT NOW()');
    console.log('Hora actual de la base de datos:', res.rows[0].now);
    client.release(); // Libera el cliente de vuelta al pool
  } catch (err) {
    console.error('Error al conectar con PostgreSQL:', err.message);
    console.error('Detalles del error:', err.stack);
    // Es importante manejar el error aquí, quizás reintentar o terminar la app si la BD es crítica.
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  testDbConnection,
  pool // Exportamos el pool por si se necesita directamente
};