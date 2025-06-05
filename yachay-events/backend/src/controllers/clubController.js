// backend/src/controllers/clubController.js
const db = require('../config/db');
const { bucket } = require('../config/firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

// @desc    Registrar un nuevo club
// @route   POST /api/clubs
// @access  Private (club_representative)
exports.registerClub = async (req, res) => {
  console.log('[clubController.registerClub] req.body:', JSON.stringify(req.body, null, 2));
  console.log('[clubController.registerClub] req.files:', req.files); // Los archivos ahora están en req.files

  const { name, description, contact_email } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (userRole !== 'club_representative') {
    return res.status(403).json({ message: 'Acción no autorizada. Solo representantes de club pueden registrar clubes.' });
  }
  if (!name) {
    return res.status(400).json({ message: 'El nombre del club es obligatorio.' });
  }

  try {
    const existingClub = await db.query('SELECT id FROM Clubs WHERE user_id = $1', [userId]);
    if (existingClub.rows.length > 0) {
      return res.status(400).json({ message: 'Este usuario ya tiene un club registrado.' });
    }

    let logoUrlToStore = req.body.logo_url_text || null;

    // Buscar el archivo del logo en req.files
    const logoFile = req.files && req.files.find(f => f.fieldname === 'clubLogo');

    if (logoFile) {
      console.log('[clubController.registerClub] Procesando archivo de logo subido:', logoFile.originalname);
      const fileName = `club-logos/${uuidv4()}-${logoFile.originalname.replace(/\s+/g, '_')}`;
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({ metadata: { contentType: logoFile.mimetype } });

      await new Promise((resolve, reject) => {
        blobStream.on('error', (err) => reject(new Error(`Error en stream al subir logo: ${err.message}`)));
        blobStream.on('finish', async () => {
          try {
            await blob.makePublic();
            logoUrlToStore = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve();
          } catch (finishError) { reject(new Error(`Error al procesar logo tras subida: ${finishError.message}`));}
        });
        blobStream.end(logoFile.buffer); // Usar el buffer del archivo encontrado
      });
    }
    
    const newClubQuery = `
      INSERT INTO Clubs (user_id, name, description, contact_email, logo_url, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, name, description, contact_email, logo_url, is_approved, created_at;
    `;
    const newClub = await db.query(newClubQuery, [userId, name, description || null, contact_email || null, logoUrlToStore, true]);
    res.status(201).json({ message: 'Club registrado exitosamente.', club: newClub.rows[0] });

  } catch (error) {
    console.error('Error al registrar el club:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Error al registrar el club. El nombre del club o el representante ya existen.' });
    }
    // El error de la Promise (subida de archivo) se propagará aquí si no se maneja antes
    res.status(500).json({ message: 'Error interno del servidor al registrar el club.', error: error.message });
  }
};


// @desc    Obtener todos los clubes (aprobados para el público, todos para admin, con paginación)
// @route   GET /api/clubs
// @access  Public (aprobados) / Private (admin para todos)
exports.getAllClubs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let commonFields = 'c.id, c.name, c.description, c.logo_url, c.user_id, u.name as representative_name'; // <--- ASEGURAR c.user_id
    let countQueryBase = 'SELECT COUNT(c.id) FROM Clubs c';
    let dataQueryBase = `SELECT ${commonFields} FROM Clubs c JOIN Users u ON c.user_id = u.id`;
    let whereConditions = [];
    
    if (req.user && req.user.role === 'admin') {
        dataQueryBase = `SELECT ${commonFields}, c.is_approved, u.email as representative_email FROM Clubs c JOIN Users u ON c.user_id = u.id`;
    } else {
        whereConditions.push('c.is_approved = TRUE');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const totalClubsQuery = `${countQueryBase} ${whereClause}`; // Los params para count no se usan aquí si whereClause no tiene params
    const totalResult = await db.query(totalClubsQuery);
    const totalItems = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const clubsDataQuery = `
      ${dataQueryBase}
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $1 OFFSET $2;
    `;
    const clubsResult = await db.query(clubsDataQuery, [limit, offset]);

    res.status(200).json({
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      clubs: clubsResult.rows // <--- ASEGÚRATE que cada objeto club aquí tenga `user_id`
    });

  } catch (error) {
    console.error('Error al obtener los clubes:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener los clubes.' });
  }
};

// @desc    Obtener un club por ID
// @route   GET /api/clubs/:id
// @access  Public (si está aprobado) / Private (admin)
exports.getClubById = async (req, res) => {
    const clubId = parseInt(req.params.id);
    if (isNaN(clubId)) {
        return res.status(400).json({ message: 'ID de club inválido.' });
    }
    try {
        let club;
        const baseQuery = 'SELECT c.*, u.name as representative_name FROM Clubs c JOIN Users u ON c.user_id = u.id WHERE c.id = $1';
        // c.* ya incluye user_id de la tabla Clubs
        if (req.user && req.user.role === 'admin') {
            const result = await db.query(baseQuery, [clubId]);
            club = result.rows[0];
        } else {
            const result = await db.query(`${baseQuery} AND c.is_approved = TRUE`, [clubId]);
            club = result.rows[0];
        }

        if (!club) {
        return res.status(404).json({ message: 'Club no encontrado o no aprobado.' });
        }
        res.status(200).json(club);
    } catch (error) {
        console.error('Error al obtener el club:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el club.' });
    }
};

// @desc    Actualizar un club
// @route   PUT /api/clubs/:id
// @access  Private (dueño del club o admin)
exports.updateClub = async (req, res) => {
  console.log('[clubController.updateClub] req.body:', JSON.stringify(req.body, null, 2));
  console.log('[clubController.updateClub] req.files:', req.files);
  
  // ... (lógica existente para obtener clubId, club, userId, userRole, validaciones) ...
  const clubId = parseInt(req.params.id);
  const { name, description, contact_email, is_approved } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (isNaN(clubId)) {
    return res.status(400).json({ message: 'ID de club inválido.' });
  }

  try {
    const clubResult = await db.query('SELECT * FROM Clubs WHERE id = $1', [clubId]);
    if (clubResult.rows.length === 0) return res.status(404).json({ message: 'Club no encontrado.' });
    const club = clubResult.rows[0];
    if (club.user_id !== userId && userRole !== 'admin') return res.status(403).json({ message: 'Acción no autorizada.' });


    let newLogoUrl = club.logo_url; 
    let oldLogoPath = null;
    if (club.logo_url && club.logo_url.startsWith(`https://storage.googleapis.com/${bucket.name}/`)) {
        oldLogoPath = club.logo_url.substring(`https://storage.googleapis.com/${bucket.name}/`.length).split('?')[0];
    }

    const logoFile = req.files && req.files.find(f => f.fieldname === 'clubLogo');

    if (logoFile) { 
      if (oldLogoPath) {
        try {
          await bucket.file(oldLogoPath).delete();
          console.log('Logo antiguo eliminado de Firebase:', oldLogoPath);
        } catch (e) {
          console.warn("El logo antiguo no se pudo eliminar de Firebase o no existía:", oldLogoPath, e.message);
        }
      }
      const fileName = `club-logos/${uuidv4()}-${logoFile.originalname.replace(/\s+/g, '_')}`;
      const blob = bucket.file(fileName);
      const blobStream = blob.createWriteStream({ metadata: { contentType: logoFile.mimetype } });
      await new Promise((resolve, reject) => { /* ... lógica de subida con logoFile.buffer ... */ 
          blobStream.on('error', (err) => reject(new Error(`Error en stream al subir nuevo logo: ${err.message}`)));
          blobStream.on('finish', async () => {
            try { await blob.makePublic(); newLogoUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; resolve(); }
            catch (finishError) { reject(new Error(`Error al procesar nuevo logo tras subida: ${finishError.message}`));}
          });
          blobStream.end(logoFile.buffer);
      });
    } else if (req.body.logo_url !== undefined) {
        const providedUrl = req.body.logo_url;
        if (providedUrl === "" || providedUrl === null) { 
            if (oldLogoPath) {
                try {
                    await bucket.file(oldLogoPath).delete();
                    console.log('Logo antiguo eliminado de Firebase (por URL vacía/nula):', oldLogoPath);
                } catch (e) {
                    console.warn("El logo antiguo no se pudo eliminar de Firebase o no existía:", oldLogoPath, e.message);
                }
            }
            newLogoUrl = null;
        } else { 
            newLogoUrl = providedUrl;
        }
    }

    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (name !== undefined) { fieldsToUpdate.push(`name = $${queryIndex++}`); values.push(name); }
    if (description !== undefined) { fieldsToUpdate.push(`description = $${queryIndex++}`); values.push(description); }
    if (contact_email !== undefined) { fieldsToUpdate.push(`contact_email = $${queryIndex++}`); values.push(contact_email); }
    if (newLogoUrl !== club.logo_url) { 
        fieldsToUpdate.push(`logo_url = $${queryIndex++}`);
        values.push(newLogoUrl);
    }

    if (is_approved !== undefined && userRole === 'admin') {
      fieldsToUpdate.push(`is_approved = $${queryIndex++}`); values.push(is_approved);
    } else if (is_approved !== undefined && userRole !== 'admin') {
        return res.status(403).json({ message: 'Solo los administradores pueden cambiar el estado de aprobación.' });
    }

  if (fieldsToUpdate.length === 0) { /* ... */ }
    values.push(clubId);
    const updateQuery = `UPDATE Clubs SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE id = $${queryIndex} RETURNING *;`;
    const updatedClubResult = await db.query(updateQuery, values);
    res.status(200).json({ message: 'Club actualizado exitosamente.', club: updatedClubResult.rows[0] });

  } catch (error) {
    console.error('Error al actualizar el club:', error);
    if (error.code === '23505' && error.constraint === 'clubs_name_key') {
      return res.status(409).json({ message: 'Error al actualizar el club. El nombre del club ya existe.' });
    }
    // El error de la Promise (subida de archivo) se propagará aquí
    res.status(500).json({ message: 'Error interno del servidor al actualizar el club.', error: error.message });
  }
};

// @desc    Eliminar un club
// @route   DELETE /api/clubs/:id
// @access  Private (admin)
exports.deleteClub = async (req, res) => {
  const clubId = parseInt(req.params.id);
  if (isNaN(clubId)) {
    return res.status(400).json({ message: 'ID de club inválido.' });
  }
  try {
    const clubResult = await db.query('SELECT logo_url FROM Clubs WHERE id = $1', [clubId]);
    if (clubResult.rows.length === 0) {
      return res.status(404).json({ message: 'Club no encontrado.' });
    }
    const clubLogoUrl = clubResult.rows[0].logo_url;

    const deleteDbResult = await db.query('DELETE FROM Clubs WHERE id = $1 RETURNING id', [clubId]);
    if (deleteDbResult.rowCount === 0) { 
      return res.status(404).json({ message: 'Club no encontrado para eliminar de la BD.' });
    }

    if (clubLogoUrl && clubLogoUrl.startsWith(`https://storage.googleapis.com/${bucket.name}/`)) {
      try {
        const logoPath = clubLogoUrl.substring(`https://storage.googleapis.com/${bucket.name}/`.length).split('?')[0];
        await bucket.file(logoPath).delete();
        console.log('Logo del club eliminado de Firebase:', logoPath);
      } catch (e) {
        console.warn("El logo del club no se pudo eliminar de Firebase o no existía:", clubLogoUrl, e.message);
      }
    }
    res.status(200).json({ message: 'Club eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el club:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el club.' });
  }
};