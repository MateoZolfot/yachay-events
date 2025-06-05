// frontend/src/services/authService.js
// import axios from 'axios'; // Ya no se usa axios directamente
import apiClient from './api'; // <--- Usar nuestra instancia configurada

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'; // Ya no es necesario aquí

const register = async (userData) => {
  try {
    const response = await apiClient.post(`/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error en el registro');
  }
};

const login = async (userData) => {
  try {
    const response = await apiClient.post(`/auth/login`, userData);
    if (response.data && response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Error during login:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Error al iniciar sesión');
  }
};

const logout = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userInfo');
};

const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

const getToken = () => {
  return localStorage.getItem('userToken');
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
};