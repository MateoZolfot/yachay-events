// frontend/src/services/attendanceService.js
import apiClient from './api'; // Usamos nuestra instancia configurada de Axios

// Registrar la asistencia de un estudiante a un evento
export const registerForEvent = async (eventId) => {
  try {
    const response = await apiClient.post(`/events/${eventId}/attend`);
    return response.data; // Debería contener { message, attendance }
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al registrar la asistencia');
  }
};

// Obtener los eventos a los que el estudiante actual se ha registrado
export const getMyAttendedEvents = async () => {
  try {
    const response = await apiClient.get(`/attendance/my-events`);
    return response.data; // Debería ser un array de eventos
  } catch (error) {
    console.error('Error fetching my attended events:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener mis eventos registrados');
  }
};