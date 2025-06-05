// frontend/src/services/eventService.js
import apiClient from './api';

// Obtener todos los eventos con paginación y filtros (existente)
export const getAllEvents = async (params) => {
  try {
    const response = await apiClient.get(`/events`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener eventos');
  }
};

// Obtener un evento por ID (existente)
export const getEventById = async (eventId) => {
  try {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener el evento');
  }
};

// **NUEVO**: Obtener eventos por clubId
// Idealmente, el backend tendría un endpoint como /api/events?clubId=<clubId> o /api/clubs/<clubId>/events
export const getEventsByClubId = async (clubId, params) => {
  try {
    // Asumimos que el backend soporta un filtro por club_id
    // Si no, esta lógica necesitaría obtener todos los eventos y filtrar en el cliente (no ideal)
    const response = await apiClient.get(`/events`, { params: { ...params, club_id: clubId } });
    return response.data; // Esperamos que el backend filtre por club_id
  } catch (error) {
    console.error(`Error fetching events for club ${clubId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener eventos del club');
  }
};

// **NUEVO**: Crear un nuevo evento
// eventData debe ser FormData si incluye un archivo (eventBanner)
export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post('/events', eventData, {
      // Axios seteará Content-Type a multipart/form-data si eventData es FormData
    });
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al crear el evento');
  }
};

// **NUEVO**: Actualizar un evento existente
// eventData debe ser FormData si incluye un archivo (eventBanner)
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await apiClient.put(`/events/${eventId}`, eventData, {
      // Axios seteará Content-Type a multipart/form-data si eventData es FormData
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${eventId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al actualizar el evento');
  }
};

// **NUEVO**: Eliminar un evento
export const deleteEvent = async (eventId) => {
  try {
    const response = await apiClient.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al eliminar el evento');
  }
};