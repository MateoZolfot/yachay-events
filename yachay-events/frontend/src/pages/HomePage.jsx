// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllEvents } from '../services/eventService';
import EventCard from '../components/EventCard';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Pagination from 'react-bootstrap/Pagination';

const HomePage = () => {
  const [eventsData, setEventsData] = useState({
    events: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 9,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateStatusFilter, setDateStatusFilter] = useState('upcoming');

  const fetchEvents = useCallback(async (page = 1, limit = 9, status = 'upcoming') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllEvents({ page, limit, date_status: status });
      setEventsData({
        events: data.events || [],
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        itemsPerPage: data.itemsPerPage || limit,
      });
    } catch (err) {
      setError(err.message || 'Error al cargar eventos.');
      setEventsData({ events: [], totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: limit });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(eventsData.currentPage, eventsData.itemsPerPage, dateStatusFilter);
  }, [fetchEvents, eventsData.currentPage, eventsData.itemsPerPage, dateStatusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= eventsData.totalPages && newPage !== eventsData.currentPage) {
      setEventsData(prev => ({ ...prev, currentPage: newPage }));
    }
  };
  
  const handleFilterChange = (newStatus) => {
    setDateStatusFilter(newStatus);
    setEventsData(prev => ({ ...prev, currentPage: 1 })); 
  };

  let paginationItems = [];
  if (eventsData.totalPages > 1) {
    for (let number = 1; number <= eventsData.totalPages; number++) {
      paginationItems.push(
        <Pagination.Item key={number} active={number === eventsData.currentPage} onClick={() => handlePageChange(number)} disabled={loading}>
          {number}
        </Pagination.Item>,
      );
    }
  }

  if (loading && eventsData.events.length === 0) {
    return <div className="text-center py-5">Cargando eventos...</div>;
  }
  if (error) {
    return <div className="text-center py-5 text-danger">Error: {error}</div>;
  }

  return (
    <Container>
      <h1 className="text-center my-4">Eventos Universitarios</h1>
      
      <div className="d-flex justify-content-center mb-4">
        <ButtonGroup>
          <Button variant={dateStatusFilter === 'upcoming' ? 'primary' : 'outline-secondary'} onClick={() => handleFilterChange('upcoming')}>Próximos</Button>
          <Button variant={dateStatusFilter === 'past' ? 'primary' : 'outline-secondary'} onClick={() => handleFilterChange('past')}>Pasados</Button>
          <Button variant={dateStatusFilter === 'all' ? 'primary' : 'outline-secondary'} onClick={() => handleFilterChange('all')}>Todos</Button>
        </ButtonGroup>
      </div>

      {loading && <div className="text-center py-3">Actualizando eventos...</div>}

      {eventsData.events.length === 0 && !loading ? (
        <p className="text-center text-muted">No hay eventos disponibles para mostrar.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {eventsData.events.map(event => (
            <Col key={event.id} className="d-flex align-items-stretch">
              <EventCard event={event} />
            </Col>
          ))}
        </Row>
      )}

      {eventsData.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5">
          <Pagination>
            <Pagination.Prev onClick={() => handlePageChange(eventsData.currentPage - 1)} disabled={eventsData.currentPage === 1 || loading} />
            {paginationItems}
            <Pagination.Next onClick={() => handlePageChange(eventsData.currentPage + 1)} disabled={eventsData.currentPage === eventsData.totalPages || loading} />
          </Pagination>
        </div>
      )}
    </Container>
  );
};

export default HomePage;
