// frontend/src/pages/EventDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventById } from '../services/eventService';
import { registerForEvent } from '../services/attendanceService'; // <--- Importar
import { useAuth } from '../context/AuthContext'; // <--- Importar
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button'; // <--- Importar Button
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const { currentUser, isAuthenticated } = useAuth(); // <--- Usar el contexto de autenticación
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({ message: '', type: '' }); // Para mensajes de registro

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      setRegistrationStatus({ message: '', type: '' });
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError(err.message || `Error al cargar el evento ${eventId}.`);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleRegisterAttendance = async () => {
    if (!isAuthenticated || currentUser?.role !== 'student') {
      setRegistrationStatus({ message: 'Debes iniciar sesión como estudiante para registrarte.', type: 'danger' });
      return;
    }
    setLoading(true); // Podrías usar un estado de carga específico para el botón
    setRegistrationStatus({ message: '', type: '' });
    try {
      const response = await registerForEvent(eventId);
      setRegistrationStatus({ message: response.message || '¡Asistencia registrada con éxito!', type: 'success' });
    } catch (err) {
      setRegistrationStatus({ message: err.message || 'Error al registrar la asistencia.', type: 'danger' });
    } finally {
      setLoading(false); // O el estado de carga específico del botón
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    return new Date(dateString).toLocaleDateString('es-EC', options);
  };

  if (loading && !event) { // Mostrar spinner solo si el evento aún no se ha cargado
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando detalles del evento...</span>
        </Spinner>
        <p>Cargando detalles del evento...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Error: {error}</Alert>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Evento no encontrado.</Alert>
      </Container>
    );
  }

  // Determinar si el evento ya pasó
  const eventHasPassed = new Date(event.date_time) < new Date();

  return (
    <Container className="my-4">
      <Card>
        <Card.Img 
          variant="top" 
          src={event.banner_image_url || 'https://placehold.co/800x400/e9ecef/6c757d?text=Detalle+del+Evento'}
          alt={`Banner de ${event.title}`}
          style={{ maxHeight: '400px', objectFit: 'cover' }}
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x400/e9ecef/6c757d?text=Error+Imagen'; }}
        />
        <Card.Body>
          <Card.Title as="h1" className="mb-3">{event.title}</Card.Title>
          <Card.Subtitle className="mb-3 text-muted">
            Organizado por: {event.club_name || 'Club Desconocido'}
          </Card.Subtitle>
          <p><strong>Fecha y Hora:</strong> {formatDate(event.date_time)}</p>
          <p><strong>Lugar:</strong> {event.location || 'Por confirmar'}</p>
          <hr />
          <p><strong>Descripción:</strong></p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{event.description || 'No hay descripción detallada disponible.'}</p>
          
          {registrationStatus.message && (
            <Alert variant={registrationStatus.type || 'info'} className="mt-3">
              {registrationStatus.message}
            </Alert>
          )}

          {isAuthenticated && currentUser?.role === 'student' && !eventHasPassed && (
            <Button 
              variant="success" 
              className="mt-3 w-100" 
              onClick={handleRegisterAttendance}
              disabled={loading} // Deshabilitar mientras se procesa
            >
              {loading ? 'Registrando...' : 'Registrar Asistencia'}
            </Button>
          )}
          {isAuthenticated && currentUser?.role === 'student' && eventHasPassed && (
             <Alert variant="info" className="mt-3">Este evento ya ha ocurrido. No es posible registrar asistencia.</Alert>
          )}
           {!isAuthenticated && !eventHasPassed && (
             <Alert variant="info" className="mt-3">Debes <Alert.Link href="/login">iniciar sesión</Alert.Link> como estudiante para registrar tu asistencia.</Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EventDetailPage;