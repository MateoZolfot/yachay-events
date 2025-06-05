// frontend/src/pages/ClubDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClub, updateClub, getClubById } from '../services/clubService'; // Asumimos que getClubById puede ser usado para obtener el club del usuario si conocemos su ID de club
import apiClient from '../services/api'; // Para una llamada directa si es necesario
import ClubForm from '../components/clubs/ClubForm';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import { Link } from 'react-router-dom'; // Para enlazar a la gestión de eventos del club

const ClubDashboardPage = () => {
  const { currentUser } = useAuth();
  const [club, setClub] = useState(null); // El club del representante
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null); // Errores específicos del formulario
  const [isEditing, setIsEditing] = useState(false); // Para mostrar el formulario de edición

  const fetchMyClub = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'club_representative') {
      setError("Acceso denegado o rol incorrecto.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const clubsResponse = await apiClient.get('/clubs?limit=10000'); 
      const userClub = clubsResponse.data.clubs.find(c => c.user_id === currentUser.id);
      
      if (userClub) {
        setClub(userClub);
        setIsEditing(false); 
      } else {
        setClub(null); 
        setIsEditing(true); 
      }
    } catch (err) {
        if (err.response && err.response.status === 404) {
            setClub(null); 
            setIsEditing(true);
        } else {
            setError(err.message || 'Error al cargar la información del club.');
            console.error("Error fetching club data:", err);
        }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyClub();
  }, [fetchMyClub]);

  const handleClubSubmit = async (formData) => {
    setLoading(true);
    setFormError(null);
    try {
      let response;
      if (club && club.id) {
        response = await updateClub(club.id, formData);
        setClub(response.club); 
        setIsEditing(false); 
        alert('Club actualizado con éxito!');
      } else { 
        response = await createClub(formData);
        setClub(response.club);
        setIsEditing(false); 
        alert('Club registrado con éxito!');
      }
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !club) { 
    return <Container className="text-center py-5"><Spinner animation="border" /> <p>Cargando dashboard del club...</p></Container>;
  }

  if (error) {
    return <Container className="py-5"><Alert variant="danger">Error: {error}</Alert></Container>;
  }
  
  if (!currentUser || currentUser.role !== 'club_representative') {
      return <Container className="py-5"><Alert variant="danger">Acceso Denegado.</Alert></Container>;
  }

  return (
    <Container className="my-4">
      <h2>Dashboard del Club</h2>
      <hr />
      {club && !isEditing ? (
        <div>
          <Card className="mb-3"> {/* Aquí se usa Card */}
            <Card.Header as="h4">{club.name}</Card.Header>
            <Card.Body>
              {club.logo_url && <Image src={club.logo_url} alt={`Logo de ${club.name}`} style={{ maxHeight: '100px', marginBottom: '15px' }} rounded />} {/* Aquí se usa Image */}
              <Card.Text><strong>Descripción:</strong> {club.description || 'No proporcionada.'}</Card.Text>
              <Card.Text><strong>Email de Contacto:</strong> {club.contact_email || 'No proporcionado.'}</Card.Text>
              <Card.Text><strong>Estado:</strong> {club.is_approved ? 'Aprobado' : 'Pendiente de Aprobación'}</Card.Text>
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="me-2">Editar Información del Club</Button>
              <Button variant="info" as={Link} to={`/dashboard/club/events`}>Gestionar Eventos del Club</Button>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <ClubForm 
          onSubmit={handleClubSubmit} 
          initialData={club} 
          isLoading={loading} 
          error={formError} 
        />
      )}
      {club && isEditing && (
        <Button variant="outline-secondary" className="mt-3" onClick={() => setIsEditing(false)}>Cancelar Edición</Button>
      )}
    </Container>
  );
};

export default ClubDashboardPage;