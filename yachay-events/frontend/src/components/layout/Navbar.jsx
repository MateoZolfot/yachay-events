// frontend/src/components/layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import NavDropdown from 'react-bootstrap/NavDropdown';

const AppNavbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <span style={{ color: '#3498db' }}>Yachay</span>Events
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Eventos</Nav.Link>
            {isAuthenticated && currentUser?.role === 'student' && (
              <Nav.Link as={Link} to="/dashboard/student">Mis Eventos</Nav.Link> 
            )}
            {isAuthenticated && currentUser?.role === 'club_representative' && ( // <--- NUEVO
              <Nav.Link as={Link} to="/dashboard/club">Mi Club</Nav.Link> 
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <NavDropdown title={currentUser?.name || 'Usuario'} id="user-nav-dropdown">
                <NavDropdown.Item as={Link} to="/profile">Mi Perfil</NavDropdown.Item>
                {currentUser?.role === 'student' && (
                  <NavDropdown.Item as={Link} to="/dashboard/student">Mis Eventos Registrados</NavDropdown.Item>
                )}
                {currentUser?.role === 'club_representative' && ( // <--- NUEVO
                  <NavDropdown.Item as={Link} to="/dashboard/club">Gestionar Mi Club</NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
                <Button as={Link} to="/register" variant="primary" size="sm" className="ms-2">Registrarse</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;