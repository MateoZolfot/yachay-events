// frontend/src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from 'react-bootstrap/Spinner';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, currentUser, loadingAuthState } = useAuth();
  const location = useLocation();

  if (loadingAuthState) {
    // Muestra un spinner o algo mientras se carga el estado de autenticación
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirigir a login
    // Guardamos la ubicación actual para redirigir de vuelta después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Si el usuario está autenticado pero su rol no está permitido para esta ruta
    // Redirigir a una página de "No Autorizado" o a la página principal
    // Por ahora, redirigimos a la página principal.
    // Podrías crear una página específica /unauthorized
    return <Navigate to="/" replace />; 
  }

  // Si está autenticado y (no se especificaron roles o su rol está permitido), renderizar el contenido de la ruta
  return <Outlet />; 
};

export default ProtectedRoute;