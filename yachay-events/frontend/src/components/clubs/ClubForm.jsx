// frontend/src/components/clubs/ClubForm.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Image } from 'react-bootstrap';

const ClubForm = ({ onSubmit, initialData = null, isLoading = false, error = null }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logo, setLogo] = useState(null); // Para el archivo del logo
  const [logoPreview, setLogoPreview] = useState(null); // Para la previsualización del logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null); // Para mostrar el logo actual si se está editando

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setContactEmail(initialData.contact_email || '');
      setCurrentLogoUrl(initialData.logo_url || null);
      setLogoPreview(initialData.logo_url || null); // Mostrar logo actual como preview inicial
    }
  }, [initialData]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file)); // Crear URL para previsualización
    } else {
      setLogo(null);
      setLogoPreview(currentLogoUrl); // Si se deselecciona, volver al logo actual o nada
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('contact_email', contactEmail);
    if (logo) { // Si se seleccionó un nuevo logo
      formData.append('clubLogo', logo); // 'clubLogo' debe coincidir con el fieldName en el backend (uploadMiddleware)
    } else if (initialData && !logoPreview && currentLogoUrl) {

    }
    
    if (initialData && logoPreview === null && currentLogoUrl !== null) {
        formData.append('logo_url', ''); // Señal para el backend de borrar la imagen
    }


    onSubmit(formData);
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>{initialData ? 'Editar Club' : 'Registrar Nuevo Club'}</Card.Title>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="clubName">
            <Form.Label>Nombre del Club</Form.Label>
            <Form.Control type="text" placeholder="Ej: Club de Debate" value={name} onChange={(e) => setName(e.target.value)} required />
          </Form.Group>

          <Form.Group className="mb-3" controlId="clubDescription">
            <Form.Label>Descripción</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Una breve descripción del club" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="clubContactEmail">
            <Form.Label>Email de Contacto del Club</Form.Label>
            <Form.Control type="email" placeholder="contacto@club.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="clubLogo">
            <Form.Label>Logo del Club</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleLogoChange} />
            {logoPreview && (
              <div className="mt-2">
                <Image src={logoPreview} alt="Previsualización del logo" thumbnail style={{ maxHeight: '150px' }} />
                {initialData && <Button variant="link" size="sm" onClick={() => { setLogo(null); setLogoPreview(null);}}>Quitar imagen</Button>}
              </div>
            )}
          </Form.Group>

          <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
            {isLoading ? (initialData ? 'Actualizando...' : 'Registrando...') : (initialData ? 'Guardar Cambios' : 'Registrar Club')}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ClubForm;