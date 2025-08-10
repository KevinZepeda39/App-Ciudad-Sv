// backend/server.js - Versión completa con autenticación integrada
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/database');
const { pool, execute } = require('./config/database');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Número de rondas de encriptación

// ✅ NUEVA FUNCIÓN DE DEBUG
function debugFormData(body, contentType) {
  console.log('\n🔍 ===== DEBUG FORMDATA =====');
  console.log('📋 Content-Type:', contentType);
  console.log('📊 Body length:', body.length);
  
  if (contentType.includes('multipart/form-data')) {
    const boundary = contentType.split('boundary=')[1];
    console.log('🔗 Boundary:', boundary);
    
    if (boundary) {
      const parts = body.split(`--${boundary}`);
      console.log('📦 Parts found:', parts.length);
      
      parts.forEach((part, index) => {
        if (part.includes('Content-Disposition: form-data')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const fieldName = nameMatch[1];
            const valueStart = part.indexOf('\r\n\r\n');
            if (valueStart !== -1) {
              let value = part.substring(valueStart + 4);
              value = value.replace(/\r\n$/, '');
              
              if (part.includes('Content-Type:')) {
                console.log(`📷 Part ${index} - ${fieldName}: [IMAGE DATA - ${value.length} bytes]`);
              } else {
                console.log(`📝 Part ${index} - ${fieldName}: "${value.trim()}"`);
              }
            }
          }
        }
      });
    }
  }
  console.log('===== END DEBUG =====\n');
}

const PORT = process.env.PORT || 3000;

// Variable para saber si la base de datos está disponible
let isDatabaseConnected = false;

// ===============================
// FUNCIONES DE COMUNIDADES
// ===============================

// Consultas SQL corregidas para tu estructura de base de datos existente
const communityQueries = {
  // Función para obtener o crear usuario por defecto
  async ensureUserExists(userId = 1) {
  if (!isDatabaseConnected) {
    console.log('⚠️ Base de datos no conectada, no hay usuario existente');
    return true;
  }
  
  try {
    console.log(`🔍 Verificando si usuario ${userId} existe...`);
    
    // Verificar si el usuario existe
    const userExists = await execute(
      'SELECT idUsuario FROM usuarios WHERE idUsuario = ?', 
      [userId]
    );
    
    if (userExists.length > 0) {
      console.log(`✅ Usuario ${userId} ya existe`);
      return true;
    }
    
    // Si no existe, intentar crearlo
    console.log(`🔄 Usuario ${userId} no existe, creándolo...`);
    
    try {
      await execute(
        'INSERT INTO usuarios (idUsuario, nombre, correo, contraseña, fechaCreacion, fechaActualizacion, activo) VALUES (?, ?, ?, ?, NOW(), NOW(), 1)',
        [userId, `Usuario ${userId}`, `usuario${userId}@miciudadsv.com`, 'password123']
      );
      console.log(`✅ Usuario ${userId} creado exitosamente`);
      return true;
    } catch (insertError) {
      console.error(`❌ Error creando usuario ${userId}:`, insertError);
      
      // Si falla la inserción, verificar si fue por duplicado
      if (insertError.code === 'ER_DUP_ENTRY') {
        console.log(`✅ Usuario ${userId} ya existía (error de duplicado)`);
        return true;
      }
      
      console.error(`❌ No se pudo crear usuario ${userId}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en ensureUserExists:', error);
    console.log('⚠️ Continuando sin verificación de usuario...');
    return false;
  }
},

  // Obtener todas las comunidades - ADAPTADA A TU ESTRUCTURA
  async getAllCommunities(userId = 1) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    // Asegurar que el usuario existe
    await this.ensureUserExists(userId);

    // Consulta adaptada a tu estructura de tabla 'comunidad'
    const sql = `
      SELECT 
        c.idComunidad as id,
        c.titulo as name,
        c.descripcion as description,
        NULL as imagen,
        c.fechaCreacion,
        u.nombre as creadorNombre,
        COUNT(DISTINCT cm.idUsuario) as memberCount,
        CASE 
          WHEN cmu.idUsuario IS NOT NULL THEN true 
          ELSE false 
        END as isJoined,
        COALESCE(cmu.esAdministrador, false) as isAdmin
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      LEFT JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
      LEFT JOIN comunidad_miembros cmu ON c.idComunidad = cmu.idComunidad AND cmu.idUsuario = ?
      WHERE c.estado = 'activa'
      GROUP BY c.idComunidad, c.titulo, c.descripcion, c.fechaCreacion, u.nombre, cmu.idUsuario, cmu.esAdministrador
      ORDER BY c.fechaCreacion DESC
    `;
    
    return await execute(sql, [userId]);
  },

  // Obtener comunidades del usuario - ADAPTADA
  async getUserCommunities(userId = 1) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    // Asegurar que el usuario existe
    await this.ensureUserExists(userId);

    const sql = `
      SELECT 
        c.idComunidad as id,
        c.titulo as name,
        c.descripcion as description,
        NULL as imagen,
        c.fechaCreacion,
        COUNT(DISTINCT cm2.idUsuario) as memberCount,
        true as isJoined,
        cm.esAdministrador as isAdmin
      FROM comunidad c
      INNER JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
      LEFT JOIN comunidad_miembros cm2 ON c.idComunidad = cm2.idComunidad
      WHERE cm.idUsuario = ? AND c.estado = 'activa'
      GROUP BY c.idComunidad, c.titulo, c.descripcion, c.fechaCreacion, cm.esAdministrador
      ORDER BY c.fechaCreacion DESC
    `;
    
    return await execute(sql, [userId]);
  },

 // Crear nueva comunidad - ACTUALIZADA PARA TU BASE DE DATOS
async createCommunity(communityData, userId = 1) {
  if (!isDatabaseConnected) {
    throw new Error('Base de datos no disponible');
  }

  // Asegurar que el usuario existe ANTES de crear la comunidad
  const userCreated = await this.ensureUserExists(userId);
  if (!userCreated) {
    throw new Error('No se pudo verificar o crear el usuario');
  }

  const { name, description, category = 'general', tags = '' } = communityData;

  try {
    // Insertar comunidad en la tabla 'comunidad' con TODOS los campos
    const insertCommunityQuery = `
      INSERT INTO comunidad (
        idUsuario, 
        titulo, 
        descripcion, 
        categoria, 
        tags, 
        fechaCreacion, 
        estado
      ) VALUES (?, ?, ?, ?, ?, NOW(), 'activa')
    `;
    
    const result = await execute(insertCommunityQuery, [
      userId,           // idUsuario (creador)
      name,            // titulo
      description,     // descripcion
      category,        // categoria
      tags            // tags
    ]);
    
    const communityId = result.insertId;
    
    // Agregar al creador como miembro administrador
    const insertMemberQuery = `
      INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion, esAdministrador)
      VALUES (?, ?, NOW(), 1)
    `;
    
    await execute(insertMemberQuery, [communityId, userId]);
    
    console.log(`✅ Comunidad creada exitosamente con ID: ${communityId}`);
    
    // Retornar la comunidad creada
    return {
      id: communityId,
      name: name,
      description: description,
      category: category,
      tags: tags,
      imagen: null,
      fechaCreacion: new Date().toISOString(),
      memberCount: 1,
      isJoined: true,
      isAdmin: true
    };
    
  } catch (error) {
    console.error('❌ Error detallado creando comunidad:', error);
    
    // Manejo específico de errores
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('El usuario especificado no existe en la base de datos');
    } else if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Ya existe una comunidad con ese título');
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      throw new Error('Faltan campos obligatorios para crear la comunidad');
    }
    
    throw new Error('Error al crear la comunidad: ' + error.message);
  }
},

  // Unirse/salir de comunidad - SIN CAMBIOS
  async toggleMembership(action, communityId, userId = 1) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    // Asegurar que el usuario existe
    await this.ensureUserExists(userId);

    // Verificar si la comunidad existe
    const communityExists = await execute(
      'SELECT idComunidad FROM comunidad WHERE idComunidad = ?',
      [communityId]
    );
    
    if (communityExists.length === 0) {
      throw new Error('Comunidad no encontrada');
    }

    if (action === 'join') {
      try {
        await execute(
          'INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion) VALUES (?, ?, NOW())',
          [communityId, userId]
        );
        return { message: 'Te has unido a la comunidad exitosamente' };
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new Error('Ya eres miembro de esta comunidad');
        }
        throw error;
      }
    } else if (action === 'leave') {
      const result = await execute(
        'DELETE FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
        [communityId, userId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('No eres miembro de esta comunidad');
      }
      
      return { message: 'Has salido de la comunidad exitosamente' };
    } else {
      throw new Error('Acción inválida. Use "join" o "leave"');
    }
  },

  // Obtener detalles de comunidad - ADAPTADA
  async getCommunityDetails(communityId, userId = 1) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    // Asegurar que el usuario existe
    await this.ensureUserExists(userId);

    const sql = `
      SELECT 
        c.idComunidad as id,
        c.titulo as name,
        c.descripcion as description,
        NULL as imagen,
        c.fechaCreacion,
        u.nombre as creadorNombre,
        COUNT(DISTINCT cm.idUsuario) as memberCount,
        CASE 
          WHEN cmu.idUsuario IS NOT NULL THEN true 
          ELSE false 
        END as isJoined,
        COALESCE(cmu.esAdministrador, false) as isAdmin
      FROM comunidad c
      LEFT JOIN usuarios u ON c.idUsuario = u.idUsuario
      LEFT JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
      LEFT JOIN comunidad_miembros cmu ON c.idComunidad = cmu.idComunidad AND cmu.idUsuario = ?
      WHERE c.idComunidad = ? AND c.estado = 'activa'
      GROUP BY c.idComunidad, c.titulo, c.descripcion, c.fechaCreacion, u.nombre, cmu.idUsuario, cmu.esAdministrador
    `;
    
    const result = await execute(sql, [userId, communityId]);
    return result.length > 0 ? result[0] : null;
  },

  async getCommunityMessages(communityId, userId = 1, page = 1, limit = 50) {
  if (!isDatabaseConnected) {
    throw new Error('Base de datos no disponible');
  }

  // Asegurar que el usuario existe
  await this.ensureUserExists(userId);

  // Verificar que el usuario es miembro O agregarlo automáticamente
  const memberCheck = await execute(
    'SELECT idMiembro FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
    [communityId, userId]
  );
  
  // Si no es miembro, automáticamente agregarlo (para facilitar las pruebas)
  if (memberCheck.length === 0) {
    console.log(`🔄 Agregando usuario ${userId} como miembro de comunidad ${communityId}...`);
    try {
      await execute(
        'INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion) VALUES (?, ?, NOW())',
        [communityId, userId]
      );
      console.log('✅ Usuario agregado como miembro automáticamente');
    } catch (error) {
      console.error('❌ Error agregando usuario como miembro:', error);
      throw new Error('No se pudo acceder a los mensajes de la comunidad');
    }
  }

  const offset = (page - 1) * limit;
  
  // QUERY CORREGIDA para usar tabla 'comentarios'
  const sql = `
    SELECT 
      c.idComentario as id,
      c.comentario as text,
      c.fechaComentario as timestamp,
      u.nombre as userName,
      u.idUsuario as userId
    FROM comentarios c
    INNER JOIN usuarios u ON c.idUsuario = u.idUsuario
    WHERE c.idComunidad = ?
    ORDER BY c.fechaComentario DESC
    LIMIT ? OFFSET ?
  `;
  
  const messages = await execute(sql, [communityId, limit, offset]);
  
  // Procesar mensajes
  return messages.map(msg => ({
    ...msg,
    imagenes: [], // No hay imágenes en comentarios por ahora
    isOwn: msg.userId === userId
  }));
},

// Función sendMessage - CORREGIDA para usar tabla 'comentarios'
async sendMessage(communityId, messageText, userId = 1) {
  if (!isDatabaseConnected) {
    throw new Error('Base de datos no disponible');
  }

  // Asegurar que el usuario existe
  await this.ensureUserExists(userId);

  // Verificar que el usuario es miembro O agregarlo automáticamente
  const memberCheck = await execute(
    'SELECT idMiembro FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
    [communityId, userId]
  );
  
  if (memberCheck.length === 0) {
    console.log(`🔄 Agregando usuario ${userId} como miembro para enviar mensaje...`);
    try {
      await execute(
        'INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion) VALUES (?, ?, NOW())',
        [communityId, userId]
      );
    } catch (error) {
      console.error('❌ Error agregando usuario:', error);
    }
  }

  // QUERY CORREGIDA para insertar en tabla 'comentarios'
  const insertResult = await execute(
    'INSERT INTO comentarios (idComunidad, idUsuario, comentario, fechaComentario) VALUES (?, ?, ?, NOW())',
    [communityId, userId, messageText]
  );

  // Obtener el mensaje creado
  const messageQuery = `
    SELECT 
      c.idComentario as id,
      c.comentario as text,
      c.fechaComentario as timestamp,
      u.nombre as userName,
      u.idUsuario as userId
    FROM comentarios c
    INNER JOIN usuarios u ON c.idUsuario = u.idUsuario
    WHERE c.idComentario = ?
  `;
  
  const result = await execute(messageQuery, [insertResult.insertId]);
  return result[0];
}
};

// Funciones de base de datos para reportes (mantener las existentes)
const reportQueries = {
  // Obtener todos los reportes
  async getAllReports() {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = `
      SELECT 
        idReporte as id,
        titulo as title,
        descripcion as description,
        nombreImagen,
        tipoImagen,
        fechaCreacion as createdAt,
        CASE 
          WHEN imagen IS NOT NULL THEN 1 
          ELSE 0 
        END as hasImage
      FROM reportes 
      ORDER BY fechaCreacion DESC
    `;
    
    const reports = await execute(sql);
    
    // Agregar campos compatibles con la app
    return reports.map(report => ({
      ...report,
      status: 'Pendiente',
      category: 'General',
      priority: 'Media',
      date: report.createdAt,
      location: 'San Salvador, El Salvador'
    }));
  },

  // Obtener reporte por ID
  async getReportById(id) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = `
      SELECT 
        idReporte as id,
        titulo as title,
        descripcion as description,
        nombreImagen,
        tipoImagen,
        fechaCreacion as createdAt,
        imagen,
        CASE 
          WHEN imagen IS NOT NULL THEN 1 
          ELSE 0 
        END as hasImage
      FROM reportes 
      WHERE idReporte = ?
    `;
    
    const reports = await execute(sql, [id]);
    
    if (reports.length === 0) {
      return null;
    }
    
    const report = reports[0];
    
    // No incluir la imagen en la respuesta para evitar grandes payloads
    delete report.imagen;
    
    return {
      ...report,
      status: 'Pendiente',
      category: 'General',
      priority: 'Media',
      date: report.createdAt,
      location: 'San Salvador, El Salvador'
    };
  },

  // Crear nuevo reporte
  async createReport(reportData) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const { title, description, imageData = null, imageName = null, imageType = null, ubicacion = 'San Salvador, El Salvador', categoria = 'general' } = reportData;
    
    const sql = `
      INSERT INTO reportes (titulo, descripcion, ubicacion, categoria, imagen, nombreImagen, tipoImagen, fechaCreacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await execute(sql, [title, description, ubicacion, categoria, imageData, imageName, imageType]);
    const newId = result.insertId;
    
    // Obtener el reporte recién creado
    return await this.getReportById(newId);
  },

  // Actualizar reporte
  async updateReport(id, updates) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const allowedFields = ['titulo', 'descripcion', 'ubicacion', 'categoria'];
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }
    
    values.push(id);
    const sql = `UPDATE reportes SET ${updateFields.join(', ')} WHERE idReporte = ?`;
    
    await execute(sql, values);
    return await this.getReportById(id);
  },

  // Eliminar reporte
  async deleteReport(id) {
    if (!isDatabaseConnected) {
      throw new Error('Base de datos no disponible');
    }

    const sql = 'DELETE FROM reportes WHERE idReporte = ?';
    const result = await execute(sql, [id]);
    return result.affectedRows > 0;
  },

  // Obtener estadísticas
  async getStats() {
    if (!isDatabaseConnected) {
      // Retornar estadísticas dummy si no hay base de datos
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        resolutionRate: 0,
        recentCount: 0
      };
    }

    try {
      // Estadísticas básicas
      const totalResult = await execute('SELECT COUNT(*) as total FROM reportes');
      const total = totalResult[0].total;
      
      // Reportes recientes (últimos 7 días)
      const recentResult = await execute(`
        SELECT COUNT(*) as recent 
        FROM reportes 
        WHERE fechaCreacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const recentCount = recentResult[0].recent;
      
      // Como tu tabla no tiene estado, simulamos los estados basado en fecha
      const pending = Math.ceil(total * 0.6);
      const inProgress = Math.ceil(total * 0.25);
      const resolved = total - pending - inProgress;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      return {
        total,
        pending,
        inProgress, 
        resolved,
        resolutionRate,
        recentCount
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        resolutionRate: 0,
        recentCount: 0
      };
    }
  }
};

// Función para parsear FormData con imagen
function parseFormDataWithImage(body, contentType) {
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) return {};

  const parts = body.split(`--${boundary}`);
  const fields = {};

  console.log('🔍 Analizando FormData...');

  for (const part of parts) {
    if (part.includes('Content-Disposition: form-data')) {
      const nameMatch = part.match(/name="([^"]+)"/);
      if (!nameMatch) continue;

      const fieldName = nameMatch[1];
      const valueStart = part.indexOf('\r\n\r\n');
      if (valueStart === -1) continue;

      let value = part.substring(valueStart + 4);
      value = value.replace(/\r\n$/, '');

      if (part.includes('Content-Type:') && fieldName === 'image') {
        console.log('📷 Procesando imagen...');
        const imageData = Buffer.from(value, 'binary');
        fields['imageData'] = imageData;
        fields['hasImage'] = true;
        
        const typeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
        if (typeMatch) {
          fields['imageType'] = typeMatch[1];
          console.log(`📋 Tipo de imagen: ${typeMatch[1]}`);
        }
        
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        fields['imageName'] = `reporte-${timestamp}-${random}.jpg`;
        
        console.log(`📁 Nombre de archivo: ${fields['imageName']}`);
        console.log(`📊 Tamaño de imagen: ${imageData.length} bytes`);
      } else {
        const cleanValue = value.trim();
        fields[fieldName] = cleanValue;
        console.log(`📝 Campo ${fieldName}: "${cleanValue}"`);
      }
    }
  }

  console.log('✅ FormData procesado:', {
    title: fields.title || 'No definido',
    description: fields.description || 'No definido', 
    ubicacion: fields.ubicacion || 'No definido',
    categoria: fields.categoria || 'No definido',
    hasImage: !!fields.imageData
  });

  return fields;
}

function saveImageToUploads(imageData, imageName) {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Directorio uploads creado');
    }
    
    const imagePath = path.join(uploadsDir, imageName);
    fs.writeFileSync(imagePath, imageData);
    
    console.log(`💾 Imagen guardada en: ${imagePath}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando imagen:', error);
    return false;
  }
}

// Crear servidor HTTP
const server = http.createServer(async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Logging
  const timestamp = new Date().toLocaleTimeString();
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP}`);

  // Manejar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  try {
    // Root endpoint - Información del servidor
    if (path === '/' && method === 'GET') {
      const stats = await reportQueries.getStats();
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'Mi Ciudad SV API',
        status: 'OK',
        version: '2.0.0',
        database: isDatabaseConnected ? 'MySQL Connected' : 'Database Offline',
        timestamp: new Date().toISOString(),
        stats: stats
      }));
      return;
    }

    // Health check endpoint
    if (path === '/api/test' && method === 'GET') {
      const stats = await reportQueries.getStats();
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'API funcionando correctamente',
        server: 'Node.js HTTP Server',
        database: isDatabaseConnected ? 'MySQL - miciudadsv' : 'Sin conexión DB',
        timestamp: new Date().toISOString(),
        stats: stats
      }));
      return;
    }

    // ========================================
    // ENDPOINTS DE AUTENTICACIÓN
    // ========================================

    // POST /api/auth/login - Iniciar sesión
    if (path === '/api/auth/login' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n🔐 === LOGIN ATTEMPT ===');
          const { email, password } = JSON.parse(body || '{}');
          
          console.log('📧 Email:', email);
          console.log('🔑 Password provided:', !!password);

          // Validar campos requeridos
          if (!email || !password) {
            console.log('❌ Missing required fields');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Email y contraseña son requeridos'
            }));
            return;
          }

          // Verificar conexión a base de datos
          if (!isDatabaseConnected) {
            console.log('⚠️ Database not connected - using demo mode');
            
            // Modo demo - credenciales de prueba
            if (email === 'lucia@example.com' && password === 'password123') {
              console.log('✅ Demo login successful');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                user: {
                  id: 3,
                  idUsuario: 3,
                  nombre: 'Lucía Martínez',
                  name: 'Lucía Martínez',
                  correo: email,
                  email: email
                },
                token: `demo-token-${Date.now()}`,
                message: 'Login exitoso (modo demo)'
              }));
              return;
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Credenciales inválidas (usa: lucia@example.com / password123)'
              }));
              return;
            }
          }

          // Buscar usuario en la base de datos
          console.log('🔍 Searching user in database...');
          const sql = 'SELECT idUsuario, nombre, correo, contraseña, activo FROM usuarios WHERE correo = ?';
          const users = await execute(sql, [email]);
          
          console.log('👥 Users found:', users.length);

          if (users.length === 0) {
            console.log('❌ User not found');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Credenciales inválidas'
            }));
            return;
          }

          const user = users[0];
          console.log('👤 User found:', user.nombre);
          console.log('✅ User active:', user.activo);

          // Verificar si el usuario está activo
          if (!user.activo) {
            console.log('❌ User is inactive');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Usuario desactivado. Contacta al administrador.'
            }));
            return;
          }

          // Verificar contraseña
          // Para el usuario de prueba, aceptar password123
          // Para otros usuarios, comparar directamente (en producción usar bcrypt)
          const isValidPassword = password === 'password123' || 
                                 password === user.contraseña ||
                                 (password.length >= 6); // Aceptar cualquier contraseña de 6+ caracteres para desarrollo
          
          console.log('🔑 Password valid:', isValidPassword);

          if (!isValidPassword) {
            console.log('❌ Invalid password');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Credenciales inválidas'
            }));
            return;
          }

          // Login exitoso
          const token = `token-${user.idUsuario}-${Date.now()}`;
          
          console.log('✅ LOGIN SUCCESSFUL for user:', user.nombre);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              id: user.idUsuario,
              idUsuario: user.idUsuario,
              nombre: user.nombre,
              name: user.nombre, // Alias para compatibilidad
              correo: user.correo,
              email: user.correo // Alias para compatibilidad
            },
            token: token,
            message: 'Inicio de sesión exitoso'
          }));

        } catch (error) {
          console.log('❌ LOGIN ERROR:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }

    // POST /api/auth/register - Registrar nuevo usuario
    if (path === '/api/auth/register' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          console.log('\n📝 === REGISTER ATTEMPT ===');
          const { nombre, email, password } = JSON.parse(body || '{}');
          
          console.log('👤 Name:', nombre);
          console.log('📧 Email:', email);
          console.log('🔑 Password provided:', !!password);

          // Validar campos requeridos
          if (!nombre || !email || !password) {
            console.log('❌ Missing required fields');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Nombre, email y contraseña son requeridos'
            }));
            return;
          }

          // Validar formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Formato de correo electrónico inválido'
            }));
            return;
          }

          // Validar longitud de contraseña
          if (password.length < 6) {
            console.log('❌ Password too short');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'La contraseña debe tener al menos 6 caracteres'
            }));
            return;
          }

          // Verificar conexión a base de datos
          if (!isDatabaseConnected) {
            console.log('⚠️ Database not connected - registration not available');
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Servicio de registro no disponible. Intenta más tarde.'
            }));
            return;
          }

          // Verificar si el email ya existe
          console.log('🔍 Checking if email already exists...');
          const checkEmailSql = 'SELECT idUsuario FROM usuarios WHERE correo = ?';
          const existingUsers = await execute(checkEmailSql, [email]);
          
          if (existingUsers.length > 0) {
            console.log('❌ Email already exists');
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Este correo electrónico ya está registrado'
            }));
            return;
          }

          // Crear nuevo usuario
          console.log('💾 Creating new user...');
          const insertSql = `
            INSERT INTO usuarios (nombre, correo, contraseña, fechaCreacion, fechaActualizacion, activo) 
            VALUES (?, ?, ?, NOW(), NOW(), 1)
          `;
          
          // NOTA: En producción deberías hashear la contraseña con bcrypt
          // const hashedPassword = await bcrypt.hash(password, 10);
          const hashedPassword = password; // Por simplicidad en desarrollo
          
          const result = await execute(insertSql, [nombre, email, hashedPassword]);
          
          const newUserId = result.insertId;
          console.log('✅ User created with ID:', newUserId);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: {
              id: newUserId,
              idUsuario: newUserId,
              nombre: nombre,
              name: nombre,
              correo: email,
              email: email
            },
            message: 'Usuario registrado exitosamente'
          }));

        } catch (error) {
          console.log('❌ REGISTER ERROR:', error.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
          }));
        }
      });
      return;
    }

    // GET /api/auth/test - Endpoint de prueba
    if (path === '/api/auth/test' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Auth endpoints are working',
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? 'connected' : 'disconnected',
        availableEndpoints: [
          'POST /api/auth/login',
          'POST /api/auth/register', 
          'GET /api/auth/test'
        ]
      }));
      return;
    }

    // GET /api/users - Ver todos los usuarios (para testing)
    if (path === '/api/users' && method === 'GET') {
      try {
        if (!isDatabaseConnected) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Base de datos no conectada'
          }));
          return;
        }

        const sql = 'SELECT idUsuario as id, nombre, correo, fechaCreacion, activo FROM usuarios';
        const users = await execute(sql);
        
        const processedUsers = users.map(user => ({
          ...user,
          activo: user.activo ? 'Sí' : 'No',
          estado: user.activo ? '🟢 Activo' : '🔴 Inactivo'
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          users: processedUsers,
          count: users.length,
          message: `Se encontraron ${users.length} usuarios en la base de datos`
        }));
      } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }

    // GET /api/users/:id - Ver usuario específico
    if (path.startsWith('/api/users/') && path.split('/').length === 4 && method === 'GET') {
      try {
        const userId = path.split('/')[3];
        
        if (!isDatabaseConnected) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Base de datos no conectada'
          }));
          return;
        }

        const sql = 'SELECT idUsuario as id, nombre, correo, fechaCreacion, activo FROM usuarios WHERE idUsuario = ?';
        const users = await execute(sql, [userId]);
        
        if (users.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: `Usuario con ID ${userId} no encontrado`
          }));
          return;
        }
        
        const user = users[0];
        const processedUser = {
          ...user,
          activo: user.activo ? 'Sí' : 'No',
          estado: user.activo ? '🟢 Activo' : '🔴 Inactivo'
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: processedUser,
          message: `Usuario ${userId} encontrado exitosamente`
        }));
      } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor'
        }));
      }
      return;
    }



    
// PUT /api/users/:id - Actualizar información personal del usuario
if (path.startsWith('/api/users/') && method === 'PUT' && path.split('/').length === 4) {
  const userId = path.split('/')[3];
  
  // Si la ruta termina en /password, manejar cambio de contraseña
  if (path.endsWith('/password')) {
    // Este endpoint se maneja más abajo
    return;
  }
  
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      console.log('\n🔄 === UPDATE USER INFO ===');
      console.log('👤 User ID:', userId);
      
      const { nombre, correo } = JSON.parse(body || '{}');
      
      console.log('📝 New name:', nombre);
      console.log('📧 New email:', correo);

      // Validar campos requeridos
      if (!nombre || !correo) {
        console.log('❌ Missing required fields');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Nombre y correo son requeridos'
        }));
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        console.log('❌ Invalid email format');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Formato de correo electrónico inválido'
        }));
        return;
      }

      // Verificar conexión a base de datos
      if (!isDatabaseConnected) {
        console.log('⚠️ Database not connected');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Base de datos no disponible'
        }));
        return;
      }

      // Verificar que el usuario existe
      console.log('🔍 Checking if user exists...');
      const userExists = await execute(
        'SELECT idUsuario FROM usuarios WHERE idUsuario = ?',
        [userId]
      );
      
      if (userExists.length === 0) {
        console.log('❌ User not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      // Verificar si el email ya está siendo usado por otro usuario
      console.log('🔍 Checking email availability...');
      const emailCheck = await execute(
        'SELECT idUsuario FROM usuarios WHERE correo = ? AND idUsuario != ?',
        [correo, userId]
      );
      
      if (emailCheck.length > 0) {
        console.log('❌ Email already in use');
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Este correo ya está siendo usado por otra cuenta'
        }));
        return;
      }

      // Actualizar información del usuario
      console.log('💾 Updating user information...');
      const updateSql = `
        UPDATE usuarios 
        SET nombre = ?, correo = ?, fechaActualizacion = NOW() 
        WHERE idUsuario = ?
      `;
      
      const result = await execute(updateSql, [nombre.trim(), correo.trim(), userId]);
      
      if (result.affectedRows === 0) {
        console.log('❌ No rows affected');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se pudo actualizar la información'
        }));
        return;
      }

      // Obtener la información actualizada
      const updatedUser = await execute(
        'SELECT idUsuario, nombre, correo, fechaCreacion, fechaActualizacion FROM usuarios WHERE idUsuario = ?',
        [userId]
      );

      console.log('✅ User information updated successfully');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Información actualizada exitosamente',
        user: {
          id: updatedUser[0].idUsuario,
          idUsuario: updatedUser[0].idUsuario,
          nombre: updatedUser[0].nombre,
          name: updatedUser[0].nombre,
          correo: updatedUser[0].correo,
          email: updatedUser[0].correo,
          fechaCreacion: updatedUser[0].fechaCreacion,
          fechaActualizacion: updatedUser[0].fechaActualizacion
        }
      }));

    } catch (error) {
      console.log('❌ UPDATE USER ERROR:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      }));
    }
  });
  return;
}



    // ===============================
    // ENDPOINTS DE COMUNIDADES
    // ===============================

    // GET /api/communities/test/connection - Test de conexión específico
    if (path === '/api/communities/test/connection' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'API de comunidades funcionando correctamente',
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? 'MySQL Connected' : 'Database Offline'
      }));
      return;
    }

    // GET /api/communities - Obtener todas las comunidades
    if (path === '/api/communities' && method === 'GET') {
      try {
        console.log('📋 Obteniendo comunidades...');
        
        if (!isDatabaseConnected) {
          // Datos de respaldo
          const fallbackData = [
            {
              id: 1,
              name: 'Seguridad Ciudadana',
              description: 'Comunidad para reportar problemas de seguridad',
              memberCount: 1234,
              isJoined: false,
              isAdmin: false,
              imagen: null,
              fechaCreacion: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Medio Ambiente',
              description: 'Cuidemos nuestro planeta juntos',
              memberCount: 567,
              isJoined: true,
              isAdmin: false,
              imagen: null,
              fechaCreacion: new Date().toISOString()
            }
          ];
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: fallbackData,
            message: 'Datos de respaldo (sin conexión)'
          }));
          return;
        }
        
        const communities = await communityQueries.getAllCommunities();
        console.log(`✅ ${communities.length} comunidades obtenidas`);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: communities,
          message: 'Comunidades obtenidas exitosamente'
        }));
      } catch (error) {
        console.error('❌ Error obteniendo comunidades:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // GET /api/communities/user - Obtener comunidades del usuario
    if (path === '/api/communities/user' && method === 'GET') {
      try {
        console.log('📋 Obteniendo comunidades del usuario...');
        
        if (!isDatabaseConnected) {
          const fallbackData = [
            {
              id: 2,
              name: 'Medio Ambiente',
              description: 'Cuidemos nuestro planeta juntos',
              memberCount: 567,
              isJoined: true,
              isAdmin: false,
              imagen: null
            }
          ];
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: fallbackData,
            message: 'Datos de respaldo (sin conexión)'
          }));
          return;
        }
        
        const communities = await communityQueries.getUserCommunities();
        console.log(`✅ Usuario tiene ${communities.length} comunidades`);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: communities,
          message: 'Comunidades del usuario obtenidas exitosamente'
        }));
      } catch (error) {
        console.error('❌ Error obteniendo comunidades del usuario:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // POST /api/communities - Crear nueva comunidad
    if (path === '/api/communities' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { name, description, category, tags } = JSON.parse(body || '{}');
          
          // Validaciones
          if (!name || !name.trim()) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'El nombre de la comunidad es requerido'
            }));
            return;
          }
          
          if (!description || !description.trim()) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'La descripción es requerida'
            }));
            return;
          }
          
          if (name.length > 50) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'El nombre no puede superar los 50 caracteres'
            }));
            return;
          }
          
          if (description.length > 200) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'La descripción no puede superar los 200 caracteres'
            }));
            return;
          }
          
          if (!isDatabaseConnected) {
            // Crear comunidad localmente como respaldo
            const newCommunity = {
              id: Date.now(),
              name: name.trim(),
              description: description.trim(),
              category: category || 'general',
              tags: tags || '',
              memberCount: 1,
              isJoined: true,
              isAdmin: true,
              imagen: null,
              fechaCreacion: new Date().toISOString()
            };
            
            res.writeHead(201);
            res.end(JSON.stringify({
              success: true,
              data: newCommunity,
              message: 'Comunidad creada (offline)'
            }));
            return;
          }
          
          console.log('🔄 Creando nueva comunidad...');
          const newCommunity = await communityQueries.createCommunity({ 
            name: name.trim(), 
            description: description.trim(),
            category: category || 'general',
            tags: tags || ''
          });
          console.log('✅ Comunidad creada exitosamente:', newCommunity);
          
          res.writeHead(201);
          res.end(JSON.stringify({
            success: true,
            data: newCommunity,
            message: 'Comunidad creada exitosamente'
          }));
        } catch (error) {
          console.error('❌ Error creando comunidad:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });
      return;
    }

    // POST /api/communities/action - Unirse/salir de comunidad
    if (path === '/api/communities/action' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { action, communityId } = JSON.parse(body || '{}');
          
          if (!['join', 'leave'].includes(action)) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'Acción inválida. Use "join" o "leave"'
            }));
            return;
          }
          
          if (!isDatabaseConnected) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: action === 'join' ? 'Te has unido a la comunidad (offline)' : 'Has salido de la comunidad (offline)'
            }));
            return;
          }
          
          console.log(`🔄 ${action} comunidad ${communityId}`);
          const result = await communityQueries.toggleMembership(action, communityId);
          console.log('✅ Acción completada exitosamente');
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: result.message
          }));
        } catch (error) {
          console.error('❌ Error en toggleMembership:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });
      return;
    }

    // GET /api/communities/:id - Obtener detalles de comunidad
    if (path.startsWith('/api/communities/') && path.split('/').length === 4 && method === 'GET') {
      try {
        const communityId = path.split('/')[3];
        console.log(`🔍 Obteniendo detalles de comunidad ${communityId}`);
        
        if (!isDatabaseConnected) {
          const mockCommunity = {
            id: parseInt(communityId),
            name: 'Comunidad Local',
            description: 'Descripción de respaldo',
            memberCount: 100,
            isJoined: true,
            isAdmin: false,
            imagen: null,
            creadorNombre: 'Usuario Local'
          };
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: mockCommunity,
            message: 'Datos de respaldo (sin conexión)'
          }));
          return;
        }
        
        const community = await communityQueries.getCommunityDetails(communityId);
        
        if (community) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: community,
            message: 'Detalles de comunidad obtenidos exitosamente'
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Comunidad no encontrada'
          }));
        }
      } catch (error) {
        console.error('❌ Error obteniendo detalles:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // GET /api/communities/:id/messages - Obtener mensajes de comunidad
    if (path.match(/\/api\/communities\/\d+\/messages$/) && method === 'GET') {
      const communityId = path.split('/')[3];
      
      try {
        console.log(`📬 Obteniendo mensajes de comunidad ${communityId}`);
        
        if (!isDatabaseConnected) {
          const fallbackMessages = [
            {
              id: 1,
              text: 'Mensaje de ejemplo (sin conexión a BD)',
              userName: 'Usuario Demo',
              timestamp: new Date().toISOString(),
              isOwn: false,
              userId: 1,
              imagenes: []
            }
          ];
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: fallbackMessages,
            message: 'Mensajes de respaldo (sin conexión)'
          }));
          return;
        }
        
        const messages = await communityQueries.getCommunityMessages(communityId);
        console.log(`✅ ${messages.length} mensajes obtenidos`);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: messages,
          message: 'Mensajes obtenidos exitosamente'
        }));
      } catch (error) {
        console.error('❌ Error obteniendo mensajes:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error interno del servidor',
          details: error.message
        }));
      }
      return;
    }

    // POST /api/communities/:id/messages - Enviar mensaje
    if (path.match(/\/api\/communities\/\d+\/messages$/) && method === 'POST') {
      const communityId = path.split('/')[3];
      
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { text } = JSON.parse(body || '{}');
          
          if (!text || !text.trim()) {
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'El mensaje no puede estar vacío'
            }));
            return;
          }
          
          if (!isDatabaseConnected) {
            const fallbackMessage = {
              id: Date.now(),
              text: text,
              userName: 'Tú',
              timestamp: new Date().toISOString(),
              isOwn: true,
              userId: 1,
              imagenes: []
            };
            
            res.writeHead(201);
            res.end(JSON.stringify({
              success: true,
              data: fallbackMessage,
              message: 'Mensaje enviado (offline)'
            }));
            return;
          }
          
          console.log('📤 Enviando mensaje a comunidad', communityId);
          const newMessage = await communityQueries.sendMessage(communityId, text.trim());
          console.log('✅ Mensaje enviado exitosamente');
          
          res.writeHead(201);
          res.end(JSON.stringify({
            success: true,
            data: {
              ...newMessage,
              isOwn: true,
              imagenes: []
            },
            message: 'Mensaje enviado exitosamente'
          }));
        } catch (error) {
          console.error('❌ Error enviando mensaje:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      });
      return;
    }

    // ===================
    // ENDPOINTS DE REPORTES (mantener los existentes)
    // ===================

    // GET /api/reports - Obtener todos los reportes
    if (path === '/api/reports' && method === 'GET') {
      try {
        console.log('📋 Obteniendo reportes...');
        
        if (!isDatabaseConnected) {
          console.log('⚠️ Base de datos no disponible, retornando datos de ejemplo');
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            reports: [
              {
                id: 'example-1',
                title: 'Ejemplo - Base de datos no disponible',
                description: 'Este es un reporte de ejemplo porque la base de datos no está disponible.',
                ubicacion: 'San Salvador, El Salvador',
                categoria: 'general',
                date: new Date().toISOString(),
                status: 'Pendiente',
                hasImage: false
              }
            ],
            count: 1,
            warning: 'Base de datos no disponible'
          }));
          return;
        }
        
        const sql = `
          SELECT 
            idReporte as id,
            titulo as title,
            descripcion as description,
            ubicacion,
            categoria,
            nombreImagen,
            tipoImagen,
            fechaCreacion as createdAt,
            CASE 
              WHEN nombreImagen IS NOT NULL THEN 1 
              ELSE 0 
            END as hasImage
          FROM reportes 
          ORDER BY fechaCreacion DESC
        `;
        
        const reports = await execute(sql);
        
        const processedReports = reports.map(report => ({
          ...report,
          status: 'Pendiente',
          date: report.createdAt,
          location: report.ubicacion || 'San Salvador, El Salvador',
          category: report.categoria || 'General',
          imageUrl: report.nombreImagen ? `/uploads/${report.nombreImagen}` : null
        }));
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          reports: processedReports,
          count: reports.length
        }));
      } catch (error) {
        console.error('❌ Error obteniendo reportes:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al obtener reportes: ' + error.message
        }));
      }
      return;
    }

    // POST /api/reports - Crear nuevo reporte
    if (path === '/api/reports' && method === 'POST') {
      let body = '';
      let rawData = Buffer.alloc(0);
      
      const contentType = req.headers['content-type'] || '';
      
      req.on('data', chunk => { 
        rawData = Buffer.concat([rawData, chunk]);
        body += chunk.toString('binary');
      });
      
      req.on('end', async () => {
        try {
          // ✅ AGREGAR DEBUG FORMDATA
          debugFormData(body, contentType);
          
          let reportData;
          
          if (contentType.includes('multipart/form-data')) {
            console.log('\n📁 Procesando FormData con posible imagen...');
            const fields = parseFormDataWithImage(body, contentType);
            
            reportData = {
              title: fields.title,
              description: fields.description,
              ubicacion: fields.ubicacion,
              categoria: fields.categoria,
              imageData: fields.imageData || null,
              imageName: fields.imageName || null,
              imageType: fields.imageType || null
            };
            
            console.log('\n📋 Datos extraídos del formulario:');
            console.log(`📝 Título: "${reportData.title}"`);
            console.log(`📝 Descripción: "${reportData.description}"`);
            console.log(`📍 Ubicación: "${reportData.ubicacion}"`);
            console.log(`🏷️ Categoría: "${reportData.categoria}"`);
            console.log(`📷 Tiene imagen: ${!!reportData.imageData}`);
            
          } else {
            console.log('📝 Procesando datos JSON...');
            const data = JSON.parse(body || '{}');
            
            reportData = {
              title: data.title,
              description: data.description,
              ubicacion: data.ubicacion,
              categoria: data.categoria,
              imageData: null,
              imageName: null,
              imageType: null
            };
          }
          
          if (!reportData.title || !reportData.description || !reportData.ubicacion || !reportData.categoria) {
            console.log('❌ Validación fallida - Campos faltantes');
            res.writeHead(400);
            res.end(JSON.stringify({
              success: false,
              error: 'Todos los campos son requeridos',
              received: {
                title: reportData.title || 'FALTANTE',
                description: reportData.description || 'FALTANTE',
                ubicacion: reportData.ubicacion || 'FALTANTE',
                categoria: reportData.categoria || 'FALTANTE'
              }
            }));
            return;
          }

          let finalImageName = null;
          if (reportData.imageData && reportData.imageName) {
            const imageSaved = saveImageToUploads(reportData.imageData, reportData.imageName);
            if (imageSaved) {
              finalImageName = reportData.imageName;
              console.log(`✅ Imagen guardada en uploads: ${finalImageName}`);
            }
          }
          
          const sql = `
            INSERT INTO reportes (
              titulo, 
              descripcion, 
              ubicacion, 
              categoria, 
              imagen, 
              nombreImagen, 
              tipoImagen, 
              fechaCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `;
          
          const result = await execute(sql, [
            reportData.title,
            reportData.description,
            reportData.ubicacion,
            reportData.categoria,
            reportData.imageData,
            finalImageName,
            reportData.imageType
          ]);
          
          const newReport = {
            id: result.insertId,
            title: reportData.title,
            description: reportData.description,
            ubicacion: reportData.ubicacion,
            categoria: reportData.categoria,
            status: 'Pendiente',
            hasImage: !!finalImageName,
            imageName: finalImageName,
            imageType: reportData.imageType,
            imageUrl: finalImageName ? `/uploads/${finalImageName}` : null,
            date: new Date().toISOString()
          };
          
          res.writeHead(201);
          res.end(JSON.stringify({
            success: true,
            report: newReport,
            message: 'Reporte guardado exitosamente'
          }));
          
        } catch (error) {
          console.error('❌ Error creando reporte:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Error al crear reporte: ' + error.message
          }));
        }
      });
      return;
    }

    // GET /api/reports/:id - Obtener reporte específico
    if (path.startsWith('/api/reports/') && method === 'GET' && path.split('/').length === 4) {
      try {
        const reportId = path.split('/')[3];
        console.log(`📄 Obteniendo reporte ID: ${reportId}`);
        
        if (!isDatabaseConnected) {
          // Reporte de ejemplo
          const mockReport = {
            id: reportId,
            title: `Reporte ${reportId} (Ejemplo)`,
            description: 'Este es un reporte de ejemplo porque la base de datos no está disponible.',
            status: 'Pendiente',
            category: 'Sistema',
            hasImage: false,
            date: new Date().toISOString(),
            location: 'San Salvador, El Salvador'
          };
          
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            report: mockReport,
            warning: 'Base de datos no disponible'
          }));
          return;
        }
        
        const report = await reportQueries.getReportById(reportId);
        
        if (report) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            report: report
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Reporte no encontrado'
          }));
        }
      } catch (error) {
        console.error('❌ Error obteniendo reporte:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al obtener reporte: ' + error.message
        }));
      }
      return;
    }

    // PUT /api/reports/:id - Actualizar reporte
    if (path.startsWith('/api/reports/') && method === 'PUT' && path.split('/').length === 4) {
      const reportId = path.split('/')[3];
      
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const updates = JSON.parse(body || '{}');
          
          if (!isDatabaseConnected) {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              message: 'Actualización simulada (base de datos no disponible)',
              warning: 'Los cambios no se guardaron permanentemente'
            }));
            return;
          }
          
          const updatedReport = await reportQueries.updateReport(reportId, updates);
          
          if (updatedReport) {
            console.log(`✅ Reporte ${reportId} actualizado`);
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              report: updatedReport,
              message: 'Reporte actualizado exitosamente'
            }));
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({
              success: false,
              error: 'Reporte no encontrado'
            }));
          }
        } catch (error) {
          console.error('❌ Error actualizando reporte:', error);
          res.writeHead(400);
          res.end(JSON.stringify({
            success: false,
            error: 'Error al actualizar reporte: ' + error.message
          }));
        }
      });
      return;
    }

    // DELETE /api/reports/:id - Eliminar reporte
    if (path.startsWith('/api/reports/') && method === 'DELETE' && path.split('/').length === 4) {
      try {
        const reportId = path.split('/')[3];
        console.log(`🗑️ Eliminando reporte ID: ${reportId}`);
        
        if (!isDatabaseConnected) {
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Eliminación simulada (base de datos no disponible)',
            warning: 'El reporte no se eliminó permanentemente'
          }));
          return;
        }
        
        const deleted = await reportQueries.deleteReport(reportId);
        
        if (deleted) {
          console.log(`✅ Reporte ${reportId} eliminado`);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            message: 'Reporte eliminado exitosamente'
          }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({
            success: false,
            error: 'Reporte no encontrado'
          }));
        }
      } catch (error) {
        console.error('❌ Error eliminando reporte:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al eliminar reporte: ' + error.message
        }));
      }
      return;
    }

    // GET /api/reports/stats - Estadísticas
    if (path === '/api/reports/stats' && method === 'GET') {
      try {
        const stats = await reportQueries.getStats();
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          stats: stats,
          databaseConnected: isDatabaseConnected
        }));
      } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
          success: false,
          error: 'Error al obtener estadísticas: ' + error.message
        }));
      }
      return;
    }

    // 404 - Ruta no encontrada
    console.log('❌ Ruta no encontrada:', path);
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      error: 'Ruta no encontrada',
      path: path,
      method: method,
      availableRoutes: [
        // Rutas básicas
        'GET /',
        'GET /api/test',
        
        // Rutas de autenticación  
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/test',
        'GET /api/users',
        'GET /api/users/:id',
        
        // Rutas de comunidades
        'GET /api/communities',
        'POST /api/communities',
        'POST /api/communities/action',
        'GET /api/communities/test/connection',
        'GET /api/communities/user',
        'GET /api/communities/:id',
        'GET /api/communities/:id/messages',
        'POST /api/communities/:id/messages',
        
        // Rutas de reportes
        'GET /api/reports',
        'POST /api/reports',
        'GET /api/reports/:id',
        'PUT /api/reports/:id',
        'DELETE /api/reports/:id',
        'GET /api/reports/stats'
      ]
    }));

  } catch (error) {
    console.error('💥 Error general del servidor:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    }));
  }
});

// Función para inicializar el servidor
async function initializeServer() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Iniciando Mi Ciudad SV Backend Server');
  console.log('='.repeat(60));
  
  // Intentar conectar a la base de datos
  try {
    isDatabaseConnected = await connectDB();
    if (isDatabaseConnected) {
      console.log('✅ Base de datos MySQL conectada exitosamente');
      
      // Verificar las tablas
      try {
        const stats = await reportQueries.getStats();
        console.log(`📊 Reportes en la base de datos: ${stats.total}`);
        
        // Verificar comunidades
        const communities = await communityQueries.getAllCommunities();
        console.log(`🏘️ Comunidades en la base de datos: ${communities.length}`);
      } catch (error) {
        console.warn('⚠️ Advertencia: No se pudieron obtener estadísticas iniciales');
      }
    } else {
      console.log('⚠️ Continuando sin base de datos - Modo desarrollo');
    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.log('⚠️ El servidor funcionará sin persistencia de datos');
    isDatabaseConnected = false;
  }
  
  // Iniciar servidor HTTP
  server.listen(PORT, '0.0.0.0', (error) => {
    if (error) {
      console.error('💥 Error al iniciar servidor HTTP:', error);
      process.exit(1);
    }
    
    console.log('='.repeat(60));
    console.log(`📱 Local:        http://localhost:${PORT}`);
    console.log(`🌐 Network:      http://192.168.1.13:${PORT}`);
    console.log(`📡 API Test:     http://192.168.1.13:${PORT}/api/test`);
    console.log(`🔐 Auth Test:    http://192.168.1.13:${PORT}/api/auth/test`);
    console.log(`👥 Users:        http://192.168.1.13:${PORT}/api/users`);
    console.log(`📋 Reports:      http://192.168.1.13:${PORT}/api/reports`);
    console.log(`🏘️ Communities:  http://192.168.1.13:${PORT}/api/communities`);
    console.log('='.repeat(60));
    console.log(`✅ Servidor HTTP corriendo en puerto ${PORT}`);
    console.log(`💾 Estado DB: ${isDatabaseConnected ? 'Conectada' : 'Desconectada'}`);
    console.log('📝 Listo para recibir peticiones...\n');
  });
}

// Manejar cierre graceful del servidor
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  
  if (isDatabaseConnected && pool) {
    try {
      await pool.end();
      console.log('✅ Pool de conexiones cerrado');
    } catch (error) {
      console.error('❌ Error cerrando pool:', error);
    }
  }
  
  console.log('👋 Servidor cerrado exitosamente');
  process.exit(0);
});

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Inicializar servidor
initializeServer();

module.exports = server;