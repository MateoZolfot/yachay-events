// frontend/src/components/events/EventForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Image } from 'react-bootstrap';

const EventForm = ({ onSubmit, initialData = null, clubId, isLoading = false, error = null, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(''); // Formato YYYY-MM-DDTHH:mm
  const [location, setLocation] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(null);

  useEffect(() => {
    console.log('[EventForm] Initializing/Updating. InitialData:', initialData, 'Club ID:', clubId);
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      const initialDate = initialData.date_time ? new Date(initialData.date_time) : null;
      if (initialDate) {
        const localIsoString = new Date(initialDate.getTime() - (initialDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setDateTime(localIsoString);
        console.log('[EventForm] Setting dateTime from initialData:', localIsoString);
      } else {
        setDateTime('');
      }
      setLocation(initialData.location || '');
      setCurrentBannerUrl(initialData.banner_image_url || null);
      setBannerPreview(initialData.banner_image_url || null);
    } else {
      // Resetear formulario para creación
      setTitle('');
      setDescription('');
      setDateTime('');
      setLocation('');
      setBannerImage(null);
      setBannerPreview(null);
      setCurrentBannerUrl(null);
      console.log('[EventForm] Resetting form for new event.');
    }
  }, [initialData, clubId]); // Añadido clubId a dependencias por si cambia y necesitamos re-evaluar

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    } else {
      setBannerImage(null);
      setBannerPreview(currentBannerUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('[EventForm] handleSubmit triggered.');
    console.log('[EventForm] Current state - dateTime:', dateTime, 'clubId:', clubId);

    if (!clubId) {
        console.error('[EventForm] Club ID is missing in form submission!');
        // Podrías mostrar un error al usuario aquí también
        return; 
    }
    if (!dateTime) {
        console.error('[EventForm] DateTime is missing or invalid before formatting!');
        // Podrías mostrar un error al usuario
        return;
    }


    const formData = new FormData();
    formData.append('club_id', clubId);
    formData.append('title', title);
    formData.append('description', description);
    try {
        formData.append('date_time', new Date(dateTime).toISOString()); // Enviar como ISO string UTC
    } catch (dateError) {
        console.error('[EventForm] Error converting dateTime to ISOString:', dateError, 'Original dateTime:', dateTime);
        // Podrías mostrar un error al usuario indicando que la fecha es inválida
        return;
    }
    formData.append('location', location);
    
    if (bannerImage) {
      formData.append('eventBanner', bannerImage);
    } else if (initialData && bannerPreview === null && currentBannerUrl !== null) {
      formData.append('banner_image_url', '');
    }

    console.log('[EventForm] FormData a enviar:');
    for (let pair of formData.entries()) {
        console.log(pair[0]+ ': '+ pair[1]);
    }
    
    onSubmit(formData);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>{initialData ? 'Editar Evento' : 'Crear Nuevo Evento'}</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          {/* ... campos del formulario ... */}
          <Form.Group className="mb-3" controlId="eventTitle">
            <Form.Label>Título del Evento</Form.Label>
            <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="eventDescription">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="eventDateTime">
            <Form.Label>Fecha y Hora</Form.Label>
            <Form.Control type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="eventLocation">
            <Form.Label>Lugar</Form.Label>
            <Form.Control type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="eventBanner">
            <Form.Label>Banner del Evento</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleBannerChange} />
            {bannerPreview && (
              <div className="mt-2">
                <Image src={bannerPreview} alt="Previsualización del banner" thumbnail style={{ maxHeight: '150px' }} />
                {initialData && <Button variant="link" size="sm" onClick={() => { setBannerImage(null); setBannerPreview(null); }}>Quitar imagen</Button>}
              </div>
            )}
          </Form.Group>
          <div className="d-flex justify-content-end">
            {onCancel && <Button variant="outline-secondary" onClick={onCancel} className="me-2" disabled={isLoading}>Cancelar</Button>}
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? (initialData ? 'Actualizando...' : 'Creando...') : (initialData ? 'Guardar Cambios' : 'Crear Evento')}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EventForm;