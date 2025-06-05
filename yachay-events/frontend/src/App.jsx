// frontend/src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import StudentDashboardPage from './pages/StudentDashboardPage'; // <--- Importar
import AppNavbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Container from 'react-bootstrap/Container';
import ClubDashboardPage from './pages/ClubDashboardPage';
import ManageClubEventsPage from './pages/ManageClubEventsPage';

function App() {
  return (
    <>
      <AppNavbar />
      <Container as="main" className="py-4">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* Ruta protegida para el dashboard de estudiantes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}> {/* <--- Proteger con rol */}
            <Route path="/dashboard/student" element={<StudentDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['club_representative']} />}>
            <Route path="/dashboard/club" element={<ClubDashboardPage />} />
            <Route path="/dashboard/club/events" element={<ManageClubEventsPage />} /> {/* <--- NUEVA RUTA */}
          </Route>

          {/* Ruta protegida para el dashboard de representante de club */}
          <Route element={<ProtectedRoute allowedRoles={['club_representative']} />}>
            <Route path="/dashboard/club" element={<ClubDashboardPage />} />
            {/* Aquí también iría la ruta para gestionar eventos de un club específico, ej: */}
            {/* <Route path="/dashboard/club/:clubId/events" element={<ManageClubEventsPage />} /> */}
          </Route>
          
          {/* Más rutas protegidas por rol aquí (ej. club_representative, admin) */}
        </Routes>
      </Container>
    </>
  );
}

export default App;