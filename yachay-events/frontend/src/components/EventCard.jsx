// frontend/src/components/EventCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-EC', options);
  };

  return (
    <Card className="h-100 shadow-sm hover-shadow-lg transition-shadow duration-300">
      <Card.Img 
        variant="top" 
        src={event.banner_image_url || 'https://placehold.co/600x400/e9ecef/6c757d?text=Evento'} 
        alt={`Banner de ${event.title}`}
        style={{ height: '200px', objectFit: 'cover' }}
        onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/e9ecef/6c757d?text=Error+Imagen'; }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h5 mb-2 text-truncate" title={event.title}>{event.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted small">
          Organizado por: {event.club_name || 'Club Desconocido'}
        </Card.Subtitle>
        <Card.Text className="small flex-grow-1" style={{ minHeight: '60px' }}>
          {event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 'Sin descripción.'}
        </Card.Text>
        <div className="mt-auto pt-3 border-top">
          <p className="small text-muted mb-1">
            <strong>Fecha:</strong> {formatDate(event.date_time)}
          </p>
          <p className="small text-muted mb-2">
            <strong>Lugar:</strong> {event.location || 'Por confirmar'}
          </p>
          <Button as={Link} to={`/events/${event.id}`} variant="primary" className="w-100 btn-sm">
            Ver Detalles
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default EventCard;