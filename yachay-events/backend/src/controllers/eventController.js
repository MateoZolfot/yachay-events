// backend/src/controllers/eventController.js
const db = require('../config/db');
const { bucket } = require('../config/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

// @desc    Crear un nuevo evento
// @route   POST /api/events
// @access  Private (club_representative del club dueño)
exports.createEvent = async (req, res) => {
  console.log('[eventController.createEvent] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[eventController.createEvent] req.body:', JSON.stringify(req.body, null, 2));
  console.log('[eventController.createEvent] req.files:', req.files); // Archivos en req.files

  const { club_id, title, description, date_time, location, video_url } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Validación (esta es la que está fallando)
  if (!club_id || !title || !description || !date_time) {
    // ... (log de error de validación) ...
    console.error('[eventController.createEvent] Validación fallida. Campos recibidos:', {club_id, title, description, date_time});
    return res.status(400).json({ message: 'Los campos club_id, title, description y date_time son obligatorios.' });
  }

  try {
    // ... (validación de club, rol y fecha) ...
    const clubResult = await db.query('SELECT id, user_id FROM Clubs WHERE id = $1', [club_id]);
    if (clubResult.rows.length === 0) return res.status(404).json({ message: 'Club no encontrado.' });
    const club = clubResult.rows[0];
    if (club.user_id !== userId && userRole !== 'admin') return res.status(403).json({ message: 'Acción no autorizada.' });
    if (isNaN(new Date(date_time).getTime())) return res.status(400).json({ message: 'Formato de fecha y hora inválido.' });


    let bannerImageUrlToStore = req.body.banner_image_url_text || null; // Si se envió como campo de texto

    // Buscar el archivo del banner en req.files
    const bannerFile = req.files && req.files.find(f => f.fieldname === 'eventBanner');

    if (bannerFile) { 
      console.log('[eventController.createEvent] Procesando archivo de banner subido:', bannerFile.originalname);
      const fileName = `event-banners/${uuidv4()}-${bannerFile.originalname.replace(/\s+/g, '_')}`;
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({ metadata: { contentType: bannerFile.mimetype } });

      await new Promise((resolve, reject) => { /* ... lógica de subida con bannerFile.buffer ... */ 
        blobStream.on('error', (err) => reject(new Error(`Error en stream al subir banner: ${err.message}`)));
        blobStream.on('finish', async () => {
          try { await blob.makePublic(); bannerImageUrlToStore = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; resolve(); }
          catch (finishError) { reject(new Error(`Error al procesar banner tras subida: ${finishError.message}`));}
        });
        blobStream.end(bannerFile.buffer);
      });
    }
    
    // ... (lógica para insertar en BD y responder) ...
    const newEventQuery = `INSERT INTO Events (club_id, title, description, date_time, location, banner_image_url, video_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
    const newEvent = await db.query(newEventQuery, [club_id, title, description, new Date(date_time), location || null, bannerImageUrlToStore, video_url || null]);
    res.status(201).json({ message: 'Evento creado exitosamente.', event: newEvent.rows[0] });

  } catch (error) {
    console.error('[eventController.createEvent] Error general:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el evento.', error: error.message });
  }
};

// @desc    Obtener todos los eventos (público, con paginación y filtro de fecha)
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res) => {
  try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const dateStatus = req.query.date_status || 'all'; 
        let dateCondition = '';
        if (dateStatus === 'upcoming') {
        dateCondition = 'AND e.date_time >= NOW()';
        } else if (dateStatus === 'past') {
        dateCondition = 'AND e.date_time < NOW()';
        }
        let orderByClause = 'ORDER BY e.date_time ';
        orderByClause += (dateStatus === 'past') ? 'DESC' : 'ASC';

        const totalEventsQuery = `
        SELECT COUNT(e.id)
        FROM Events e
        JOIN Clubs c ON e.club_id = c.id
        WHERE c.is_approved = TRUE ${dateCondition};
        `;
        const totalResult = await db.query(totalEventsQuery);
        const totalItems = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const eventsQuery = `
        SELECT e.id, e.title, e.description, e.date_time, e.location, e.banner_image_url, 
                c.name as club_name, c.id as club_id
        FROM Events e
        JOIN Clubs c ON e.club_id = c.id
        WHERE c.is_approved = TRUE ${dateCondition}
        ${orderByClause}
        LIMIT $1 OFFSET $2;
        `;
        const eventsResult = await db.query(eventsQuery, [limit, offset]);

        res.status(200).json({
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        events: eventsResult.rows
        });

    } catch (error) {
        console.error('Error al obtener los eventos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los eventos.' });
    }
};

// @desc    Obtener un evento por ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
  const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
        return res.status(400).json({ message: 'ID de evento inválido.' });
    }

    try {
        const query = `
        SELECT e.*, c.name as club_name 
        FROM Events e
        JOIN Clubs c ON e.club_id = c.id
        WHERE e.id = $1 AND c.is_approved = TRUE; 
        `;
        const eventResult = await db.query(query, [eventId]);

        if (eventResult.rows.length === 0) {
        return res.status(404).json({ message: 'Evento no encontrado o pertenece a un club no aprobado.' });
        }
        res.status(200).json(eventResult.rows[0]);
    } catch (error) {
        console.error('Error al obtener el evento:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el evento.' });
    }
};

// @desc    Actualizar un evento
// @route   PUT /api/events/:id
// @access  Private (dueño del club del evento o admin)
exports.updateEvent = async (req, res) => {
  console.log('[eventController.updateEvent] req.body:', JSON.stringify(req.body, null, 2));
  console.log('[eventController.updateEvent] req.files:', req.files);
  // ... resto de la lógica de updateEvent ...
  const eventId = parseInt(req.params.id);
  const { title, description, date_time, location, video_url } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido.' });
  }

  // Añadir validación de campos obligatorios si es necesario para la actualización también
  if (!title || !description || !date_time) { // Ejemplo, ajusta según tus reglas de actualización
    console.error('[eventController.updateEvent] Validación fallida para actualización.');
    return res.status(400).json({ message: 'Título, descripción y fecha son obligatorios para actualizar.' });
  }

  try {
    const eventResult = await db.query(`SELECT e.*, c.user_id as club_owner_id FROM Events e JOIN Clubs c ON e.club_id = c.id WHERE e.id = $1;`, [eventId]);
    if (eventResult.rows.length === 0) return res.status(404).json({ message: 'Evento no encontrado.' });
    const event = eventResult.rows[0];

    if (event.club_owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }
    if (date_time && isNaN(new Date(date_time).getTime())) {
        return res.status(400).json({ message: 'Formato de fecha y hora inválido para date_time.' });
    }

    let newBannerImageUrl = event.banner_image_url;
    let oldBannerPath = null;
    if (event.banner_image_url && event.banner_image_url.startsWith(`https://storage.googleapis.com/${bucket.name}/`)) {
        oldBannerPath = event.banner_image_url.substring(`https://storage.googleapis.com/${bucket.name}/`.length).split('?')[0];
    }

    const bannerFile = req.files && req.files.find(f => f.fieldname === 'eventBanner');

    if (bannerFile) { 
      if (oldBannerPath) {
        try {
          await bucket.file(oldBannerPath).delete();
          console.log('Banner antiguo eliminado de Firebase:', oldBannerPath);
        } catch (e) {
          console.warn("El banner antiguo no se pudo eliminar de Firebase o no existía:", oldBannerPath, e.message);
        }
      }
      const fileName = `event-banners/${uuidv4()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });
      await new Promise((resolve, reject) => { /* ... lógica de subida ... */ 
        blobStream.on('error', (err) => reject(new Error(`Error en stream al subir nuevo banner: ${err.message}`)));
        blobStream.on('finish', async () => {
          try { await blob.makePublic(); newBannerImageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; resolve(); }
          catch (finishError) { reject(new Error(`Error al procesar nuevo banner tras subida: ${finishError.message}`));}
        });
        blobStream.end(req.file.buffer);
      });
    } else if (req.body.banner_image_url !== undefined) {
        const providedUrl = req.body.banner_image_url;
        if (providedUrl === "" || providedUrl === null) {
            if (oldBannerPath) {
                try {
                    await bucket.file(oldBannerPath).delete();
                    console.log('Banner antiguo eliminado de Firebase (por URL vacía/nula):', oldBannerPath);
                } catch (e) {
                    console.warn("El banner antiguo no se pudo eliminar de Firebase o no existía:", oldBannerPath, e.message);
                }
            }
            newBannerImageUrl = null;
        } else {
            newBannerImageUrl = providedUrl;
        }
    }

    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (title !== undefined) { fieldsToUpdate.push(`title = $${queryIndex++}`); values.push(title); }
    // ... (añadir otros campos) ...
    if (description !== undefined) { fieldsToUpdate.push(`description = $${queryIndex++}`); values.push(description); }
    if (date_time !== undefined) { fieldsToUpdate.push(`date_time = $${queryIndex++}`); values.push(new Date(date_time)); }
    if (location !== undefined) { fieldsToUpdate.push(`location = $${queryIndex++}`); values.push(location); }
    if (video_url !== undefined) { fieldsToUpdate.push(`video_url = $${queryIndex++}`); values.push(video_url); }
    
    if (newBannerImageUrl !== event.banner_image_url) {
        fieldsToUpdate.push(`banner_image_url = $${queryIndex++}`);
        values.push(newBannerImageUrl);
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(200).json({ message: 'No se proporcionaron campos diferentes para actualizar.', event: { ...event, banner_image_url: newBannerImageUrl } });
    }

    values.push(eventId);
    const updateQuery = `UPDATE Events SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *;`;
    const updatedEventResult = await db.query(updateQuery, values);
    res.status(200).json({ message: 'Evento actualizado exitosamente.', event: updatedEventResult.rows[0] });

  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el evento.', error: error.message });
  }
};

// @desc    Eliminar un evento
// @route   DELETE /api/events/:id
// @access  Private (dueño del club del evento o admin)
exports.deleteEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;
  const userRole = req.user.role;

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'ID de evento inválido.' });
  }
  try {
    const eventClubQuery = `
        SELECT e.id, e.banner_image_url, c.user_id as club_owner_id 
        FROM Events e 
        JOIN Clubs c ON e.club_id = c.id 
        WHERE e.id = $1;
    `;
    const eventResult = await db.query(eventClubQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }
    const eventToDelete = eventResult.rows[0];

    if (eventToDelete.club_owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    const deleteDbResult = await db.query('DELETE FROM Events WHERE id = $1 RETURNING id', [eventId]);
    if (deleteDbResult.rowCount === 0) {
      return res.status(404).json({ message: 'Evento no encontrado para eliminar de la BD.' });
    }

    if (eventToDelete.banner_image_url && eventToDelete.banner_image_url.startsWith(`https://storage.googleapis.com/${bucket.name}/`)) {
      try {
        const bannerPath = eventToDelete.banner_image_url.substring(`https://storage.googleapis.com/${bucket.name}/`.length).split('?')[0];
        await bucket.file(bannerPath).delete();
        console.log('Banner del evento eliminado de Firebase:', bannerPath);
      } catch (e) {
        console.warn("El banner del evento no se pudo eliminar de Firebase o no existía:", eventToDelete.banner_image_url, e.message);
      }
    }
    res.status(200).json({ message: 'Evento eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el evento.' });
  }
};