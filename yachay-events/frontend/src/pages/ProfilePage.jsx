// frontend/src/pages/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

const ProfilePage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Esto no debería suceder si la ruta está protegida correctamente, pero es una buena verificación.
    return <Alert variant="warning">No se pudo cargar la información del perfil.</Alert>;
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header as="h2">Mi Perfil</Card.Header>
        <Card.Body>
          <Card.Text><strong>Nombre:</strong> {currentUser.name}</Card.Text>
          <Card.Text><strong>Email:</strong> {currentUser.email}</Card.Text>
          <Card.Text><strong>Rol:</strong> {currentUser.role}</Card.Text>
          {/* Aquí podrías añadir más información o enlaces para editar el perfil, etc. */}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProfilePage;