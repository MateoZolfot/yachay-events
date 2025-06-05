// backend/src/config/firebaseAdmin.js
const admin = require('firebase-admin');

// La ruta al archivo de credenciales se pasará a través de una variable de entorno
// GOOGLE_APPLICATION_CREDENTIALS que configuraremos en docker-compose.yml
// También necesitarás el nombre de tu bucket de Storage.
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET; // Ej: "yachayevents-12345.appspot.com"

if (!serviceAccountPath) {
  console.error('Error crítico: La variable de entorno GOOGLE_APPLICATION_CREDENTIALS no está definida.');
  // process.exit(1); // Considera salir si es indispensable para el arranque
}
if (!firebaseStorageBucket) {
  console.error('Error crítico: La variable de entorno FIREBASE_STORAGE_BUCKET no está definida.');
  // process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    storageBucket: firebaseStorageBucket 
  });
  console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error.message);
  // process.exit(1);
}

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };