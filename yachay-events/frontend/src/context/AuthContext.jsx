// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true); // Para manejar la carga inicial del estado

  useEffect(() => {
    // Esta carga inicial es útil si el usuario ya estaba logueado
    const user = authService.getCurrentUser();
    const storedToken = authService.getToken();
    if (user && storedToken) {
      setCurrentUser(user);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      setCurrentUser(data.user);
      setToken(data.token);
      return data; // Devuelve la respuesta completa para manejo en el componente
    } catch (error) {
      // El error ya se maneja y se lanza desde authService
      // Aquí podrías añadir lógica adicional si es necesario, o simplemente relanzar
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      // Opcional: Iniciar sesión automáticamente después del registro si el backend devuelve token
      // O redirigir a la página de login
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setToken(null);
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token, // Un booleano simple para verificar si está autenticado
    loadingAuthState: loading, // Para saber si el estado inicial ya se cargó
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
