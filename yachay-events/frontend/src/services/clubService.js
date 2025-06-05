// frontend/src/services/clubService.js
import apiClient from './api'; // Usamos nuestra instancia configurada de Axios

// formData debe ser un objeto FormData si se incluye un archivo (logo)
export const createClub = async (clubData) => {
  try {
    // Si clubData es FormData, axios lo manejará correctamente
    const response = await apiClient.post('/clubs', clubData, {
      headers: {
       }
    });
    return response.data; // Debería contener { message, club }
  } catch (error) {
    console.error('Error creating club:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al crear el club');
  }
};

// Actualizar un club existente
// formData debe ser un objeto FormData si se incluye un archivo (logo)
export const updateClub = async (clubId, clubData) => {
  try {
    const response = await apiClient.put(`/clubs/${clubId}`, clubData, {
      headers: {
        // Similar a createClub, si es FormData, axios maneja el Content-Type
      }
    });
    return response.data; // Debería contener { message, club }
  } catch (error) {
    console.error(`Error updating club ${clubId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al actualizar el club');
  }
};


export const getMyClub = async (userId) => {
  try {

    const response = await apiClient.get('/clubs?limit=1000'); // Obtener todos, ¡no ideal!
    const allClubs = response.data.clubs || [];
    const myClub = allClubs.find(club => club.representative_id === userId); 
    return null; // Placeholder, el dashboard lo manejará.
  } catch (error) {
    console.error('Error fetching my club:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener mi club');
  }
};


// Obtener detalles de un club por ID (público)
export const getClubById = async (clubId) => {
  try {
    const response = await apiClient.get(`/clubs/${clubId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching club ${clubId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al obtener el club');
  }
};