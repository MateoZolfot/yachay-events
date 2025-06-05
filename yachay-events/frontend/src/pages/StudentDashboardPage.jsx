// frontend/src/pages/StudentDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { getMyAttendedEvents } from '../services/attendanceService';
import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';

const StudentDashboardPage = () => {
  const { currentUser } = useAuth();
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendedEvents = async () => {
      if (currentUser) {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyAttendedEvents();
          setAttendedEvents(data);
        } catch (err) {
          setError(err.message || 'Error al cargar los eventos a los que te has registrado.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // No hay usuario, no cargar nada
      }
    };

    fetchAttendedEvents();
  }, [currentUser]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-EC', options);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" /> <p>Cargando tus eventos...</p>
      </Container>
    );
  }

  if (error) {
    return <Container className="py-5"><Alert variant="danger">Error: {error}</Alert></Container>;
  }

  return (
    <Container className="my-4">
      <h2>Mis Eventos Registrados</h2>
      <hr />
      {attendedEvents.length === 0 ? (
        <Alert variant="info">Aún no te has registrado a ningún evento. ¡<Alert.Link as={Link} to="/">Explora los eventos</Alert.Link> disponibles!</Alert>
      ) : (
        <ListGroup>
          {attendedEvents.map(event => (
            <ListGroup.Item key={event.id} action as={Link} to={`/events/${event.id}`} className="mb-2 shadow-sm">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{event.title}</h5>
                <small className="text-muted">{formatDate(event.date_time)}</small>
              </div>
              <p className="mb-1 small text-muted">Organizado por: {event.club_name}</p>
              <small className="text-muted">Registrado el: {formatDate(event.registration_time)}</small>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default StudentDashboardPage;
