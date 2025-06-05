// frontend/src/pages/ManageClubEventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEventsByClubId, deleteEvent, createEvent, updateEvent } from '../services/eventService';
import apiClient from '../services/api';
import EventForm from '../components/events/EventForm';
import { Container, Button, ListGroup, Modal, Spinner, Alert, Row, Col } from 'react-bootstrap';

const ManageClubEventsPage = () => {
  const { currentUser } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const navigate = useNavigate();

  const fetchMyClubAndEvents = useCallback(async () => {
    console.log('[ManageClubEventsPage] fetchMyClubAndEvents_component_invoked');
    if (!currentUser || currentUser.role !== 'club_representative') {
      setError("Acceso denegado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('[ManageClubEventsPage] Intentando obtener clubes...');
      const clubsResponse = await apiClient.get('/clubs?limit=10000'); 
      console.log('[ManageClubEventsPage] Respuesta de clubes:', clubsResponse.data);
      const userClub = clubsResponse.data.clubs.find(c => c.user_id === currentUser.id);
      console.log('[ManageClubEventsPage] Club encontrado para usuario:', userClub);

      if (userClub) {
        setClub(userClub);
        console.log('[ManageClubEventsPage] Obteniendo eventos para club ID:', userClub.id);
        const eventsData = await getEventsByClubId(userClub.id);
        console.log('[ManageClubEventsPage] Eventos del club:', eventsData);
        setEvents(eventsData.events || []);
      } else {
        setError("No se encontró un club para este representante. Registre un club primero.");
        console.warn('[ManageClubEventsPage] No se encontró club para el usuario ID:', currentUser.id);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar datos del club o eventos.');
      console.error("[ManageClubEventsPage] Error fetching club/events data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchMyClubAndEvents();
  }, [fetchMyClubAndEvents]);

  const handleShowCreateForm = () => {
    console.log('[ManageClubEventsPage] Abriendo formulario para CREAR evento. Club actual:', club);
    if (!club || !club.id) {
        alert("Error: No se pudo identificar el club para crear el evento. Asegúrate de que tu club esté cargado.");
        return;
    }
    setEditingEvent(null);
    setFormError(null);
    setShowFormModal(true);
  };

  // ... (resto de las funciones handleShowEditForm, handleCloseFormModal, handleEventSubmit, handleDeleteEvent, formatDate sin cambios mayores)
  const handleShowEditForm = (event) => {
    setEditingEvent(event);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingEvent(null);
  };

  const handleEventSubmit = async (formData) => {
    setLoading(true); 
    setFormError(null);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        alert('Evento actualizado con éxito!');
      } else {
        await createEvent(formData);
        alert('Evento creado con éxito!');
      }
      setShowFormModal(false);
      fetchMyClubAndEvents(); 
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error al guardar el evento.');
      console.error("[ManageClubEventsPage] Error submitting event form:", err);
    } finally {
      setLoading(false); 
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      setLoading(true); 
      setError(null);
      try {
        await deleteEvent(eventId);
        alert('Evento eliminado con éxito!');
        fetchMyClubAndEvents(); 
      } catch (err) {
        setError(err.message || 'Error al eliminar el evento.');
      } finally {
        setLoading(false); 
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };


  if (loading && !club) {
    return <Container className="text-center py-5"><Spinner /> Cargando...</Container>;
  }
  if (error && !showFormModal) { 
    return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;
  }
  if (!club && !loading) { 
    return (
      <Container className="py-5">
        <Alert variant="warning">
          No se ha encontrado información de tu club. Por favor, <Alert.Link as={Link} to="/dashboard/club">configura tu club</Alert.Link> primero.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      {/* ... (resto del JSX de renderizado sin cambios mayores) ... */}
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>Gestionar Eventos de "{club ? club.name : 'Mi Club'}"</h2>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={handleShowCreateForm} disabled={!club}>
            <i className="bi bi-plus-circle-fill me-2"></i>Crear Nuevo Evento
          </Button>
        </Col>
      </Row>
      <hr />
      {error && !showFormModal && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {loading && events.length === 0 && club ? <p>Cargando eventos...</p> : null}
      {!loading && events.length === 0 && club ? (
        <Alert variant="info">Tu club aún no tiene eventos. ¡Crea el primero!</Alert>
      ) : null}
      {events.length > 0 && club && (
        <ListGroup>
          {events.map(event => (
            <ListGroup.Item key={event.id} className="d-flex justify-content-between align-items-center">
              <div>
                <h5><Link to={`/events/${event.id}`}>{event.title}</Link></h5>
                <small className="text-muted">{formatDate(event.date_time)} - {event.location || 'N/A'}</small>
              </div>
              <div>
                <Button variant="outline-primary" size="sm" onClick={() => handleShowEditForm(event)} className="me-2">
                  <i className="bi bi-pencil-square"></i> Editar
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteEvent(event.id)} disabled={loading}>
                  <i className="bi bi-trash-fill"></i> Eliminar
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      <Modal show={showFormModal} onHide={handleCloseFormModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {club && 
            <EventForm
              onSubmit={handleEventSubmit}
              initialData={editingEvent}
              clubId={club.id} 
              isLoading={loading} 
              error={formError}
              onCancel={handleCloseFormModal}
            />
          }
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ManageClubEventsPage;