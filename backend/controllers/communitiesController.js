// backend/controllers/communitiesController.js
const { execute, transaction } = require('../config/database');

const communitiesController = {
  // Obtener todas las comunidades
  getAllCommunities: async (req, res) => {
    try {
      console.log('🔍 Obteniendo todas las comunidades...');
      
      const query = `
        SELECT 
          c.idComunidad as id,
          c.nombre as name,
          c.descripcion as description,
          c.imagen,
          c.fechaCreacion,
          u.nombre as creadorNombre,
          COUNT(DISTINCT cm.idUsuario) as memberCount,
          CASE 
            WHEN cmu.idUsuario IS NOT NULL THEN true 
            ELSE false 
          END as isJoined
        FROM comunidades c
        LEFT JOIN usuarios u ON c.idCreador = u.idUsuario
        LEFT JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
        LEFT JOIN comunidad_miembros cmu ON c.idComunidad = cmu.idComunidad AND cmu.idUsuario = ?
        WHERE c.idComunidad IS NOT NULL
        GROUP BY c.idComunidad, c.nombre, c.descripcion, c.imagen, c.fechaCreacion, u.nombre, cmu.idUsuario
        ORDER BY c.fechaCreacion DESC
      `;
      
      // Por ahora usar idUsuario = 1 como default (más tarde implementar auth real)
      const userId = req.user?.idUsuario || 1;
      const communities = await execute(query, [userId]);
      
      console.log(`✅ Encontradas ${communities.length} comunidades`);
      
      res.json({
        success: true,
        data: communities,
        message: 'Comunidades obtenidas exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getAllCommunities:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Obtener comunidades del usuario
  getUserCommunities: async (req, res) => {
    try {
      console.log('🔍 Obteniendo comunidades del usuario...');
      
      const query = `
        SELECT 
          c.idComunidad as id,
          c.nombre as name,
          c.descripcion as description,
          c.imagen,
          c.fechaCreacion,
          COUNT(DISTINCT cm.idUsuario) as memberCount,
          true as isJoined,
          cm.esAdministrador as isAdmin
        FROM comunidades c
        INNER JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
        LEFT JOIN comunidad_miembros cm2 ON c.idComunidad = cm2.idComunidad
        WHERE cm.idUsuario = ?
        GROUP BY c.idComunidad, c.nombre, c.descripcion, c.imagen, c.fechaCreacion, cm.esAdministrador
        ORDER BY c.fechaCreacion DESC
      `;
      
      const userId = req.user?.idUsuario || 1;
      const communities = await execute(query, [userId]);
      
      console.log(`✅ Usuario tiene ${communities.length} comunidades`);
      
      res.json({
        success: true,
        data: communities,
        message: 'Comunidades del usuario obtenidas exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getUserCommunities:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Crear nueva comunidad
  createCommunity: async (req, res) => {
    try {
      console.log('🔄 Creando nueva comunidad...');
      const { name, description } = req.body;
      
      // Validaciones
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El nombre de la comunidad es requerido'
        });
      }
      
      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: 'La descripción es requerida'
        });
      }
      
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'El nombre no puede superar los 50 caracteres'
        });
      }
      
      const userId = req.user?.idUsuario || 1;
      
      // Crear slug único
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      // Usar transacción para crear comunidad y agregar al creador como miembro
      const result = await transaction(async (connection) => {
        // Insertar comunidad
        const insertCommunityQuery = `
          INSERT INTO comunidades (nombre, descripcion, slug, idCreador, fechaCreacion)
          VALUES (?, ?, ?, ?, NOW())
        `;
        
        const [communityResult] = await connection.execute(insertCommunityQuery, [
          name.trim(),
          description.trim(),
          slug,
          userId
        ]);
        
        const communityId = communityResult.insertId;
        
        // Agregar al creador como miembro administrador
        const insertMemberQuery = `
          INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion, esAdministrador)
          VALUES (?, ?, NOW(), 1)
        `;
        
        await connection.execute(insertMemberQuery, [communityId, userId]);
        
        // Obtener la comunidad creada con información completa
        const getCommunityQuery = `
          SELECT 
            c.idComunidad as id,
            c.nombre as name,
            c.descripcion as description,
            c.imagen,
            c.fechaCreacion,
            1 as memberCount,
            true as isJoined,
            true as isAdmin
          FROM comunidades c
          WHERE c.idComunidad = ?
        `;
        
        const [newCommunity] = await connection.execute(getCommunityQuery, [communityId]);
        
        return newCommunity[0];
      });
      
      console.log('✅ Comunidad creada exitosamente:', result);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Comunidad creada exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en createCommunity:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una comunidad con ese nombre'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Unirse o salir de una comunidad
  toggleMembership: async (req, res) => {
    try {
      const { action, communityId } = req.body;
      const userId = req.user?.idUsuario || 1;
      
      console.log(`🔄 ${action} comunidad ${communityId} para usuario ${userId}`);
      
      if (!['join', 'leave'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Acción inválida. Use "join" o "leave"'
        });
      }
      
      if (!communityId) {
        return res.status(400).json({
          success: false,
          error: 'ID de comunidad requerido'
        });
      }
      
      // Verificar si la comunidad existe
      const communityExists = await execute(
        'SELECT idComunidad FROM comunidades WHERE idComunidad = ?',
        [communityId]
      );
      
      if (communityExists.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comunidad no encontrada'
        });
      }
      
      if (action === 'join') {
        // Unirse a la comunidad
        try {
          await execute(
            'INSERT INTO comunidad_miembros (idComunidad, idUsuario, fechaUnion) VALUES (?, ?, NOW())',
            [communityId, userId]
          );
          
          console.log('✅ Usuario se unió a la comunidad');
          res.json({
            success: true,
            message: 'Te has unido a la comunidad exitosamente'
          });
          
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
              success: false,
              error: 'Ya eres miembro de esta comunidad'
            });
          }
          throw error;
        }
        
      } else {
        // Salir de la comunidad
        const result = await execute(
          'DELETE FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
          [communityId, userId]
        );
        
        if (result.affectedRows === 0) {
          return res.status(400).json({
            success: false,
            error: 'No eres miembro de esta comunidad'
          });
        }
        
        console.log('✅ Usuario salió de la comunidad');
        res.json({
          success: true,
          message: 'Has salido de la comunidad exitosamente'
        });
      }
      
    } catch (error) {
      console.error('❌ Error en toggleMembership:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Obtener detalles de una comunidad específica
  getCommunityDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.idUsuario || 1;
      
      console.log(`🔍 Obteniendo detalles de comunidad ${id}`);
      
      const query = `
        SELECT 
          c.idComunidad as id,
          c.nombre as name,
          c.descripcion as description,
          c.imagen,
          c.fechaCreacion,
          u.nombre as creadorNombre,
          COUNT(DISTINCT cm.idUsuario) as memberCount,
          CASE 
            WHEN cmu.idUsuario IS NOT NULL THEN true 
            ELSE false 
          END as isJoined,
          COALESCE(cmu.esAdministrador, false) as isAdmin
        FROM comunidades c
        LEFT JOIN usuarios u ON c.idCreador = u.idUsuario
        LEFT JOIN comunidad_miembros cm ON c.idComunidad = cm.idComunidad
        LEFT JOIN comunidad_miembros cmu ON c.idComunidad = cmu.idComunidad AND cmu.idUsuario = ?
        WHERE c.idComunidad = ?
        GROUP BY c.idComunidad, c.nombre, c.descripcion, c.imagen, c.fechaCreacion, u.nombre, cmu.idUsuario, cmu.esAdministrador
      `;
      
      const community = await execute(query, [userId, id]);
      
      if (community.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comunidad no encontrada'
        });
      }
      
      console.log('✅ Detalles de comunidad obtenidos');
      
      res.json({
        success: true,
        data: community[0],
        message: 'Detalles de comunidad obtenidos exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getCommunityDetails:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Obtener mensajes de una comunidad
  getCommunityMessages: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.idUsuario || 1;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      
      console.log(`🔍 Obteniendo mensajes de comunidad ${id}`);
      
      // Verificar que el usuario es miembro de la comunidad
      const memberCheck = await execute(
        'SELECT idMiembro FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
        [id, userId]
      );
      
      if (memberCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Debes ser miembro de la comunidad para ver los mensajes'
        });
      }
      
      const query = `
        SELECT 
          cm.idMensaje as id,
          cm.contenido as text,
          cm.fechaEnvio as timestamp,
          u.nombre as userName,
          u.idUsuario as userId,
          GROUP_CONCAT(cmi.rutaImagen) as imagenes
        FROM comunidad_mensajes cm
        INNER JOIN usuarios u ON cm.idUsuario = u.idUsuario
        LEFT JOIN comunidad_mensaje_imagenes cmi ON cm.idMensaje = cmi.idMensaje
        WHERE cm.idComunidad = ?
        GROUP BY cm.idMensaje, cm.contenido, cm.fechaEnvio, u.nombre, u.idUsuario
        ORDER BY cm.fechaEnvio DESC
        LIMIT ? OFFSET ?
      `;
      
      const messages = await execute(query, [id, limit, offset]);
      
      // Procesar imágenes
      const processedMessages = messages.map(msg => ({
        ...msg,
        imagenes: msg.imagenes ? msg.imagenes.split(',') : [],
        isOwn: msg.userId === userId
      }));
      
      console.log(`✅ Obtenidos ${messages.length} mensajes`);
      
      res.json({
        success: true,
        data: processedMessages,
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        },
        message: 'Mensajes obtenidos exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en getCommunityMessages:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  },

  // Enviar mensaje a una comunidad
  sendMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.idUsuario || 1;
      
      console.log(`📤 Enviando mensaje a comunidad ${id}`);
      
      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje no puede estar vacío'
        });
      }
      
      // Verificar que el usuario es miembro
      const memberCheck = await execute(
        'SELECT idMiembro FROM comunidad_miembros WHERE idComunidad = ? AND idUsuario = ?',
        [id, userId]
      );
      
      if (memberCheck.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Debes ser miembro de la comunidad para enviar mensajes'
        });
      }
      
      // Insertar mensaje
      const insertResult = await execute(
        'INSERT INTO comunidad_mensajes (idComunidad, idUsuario, contenido, fechaEnvio) VALUES (?, ?, ?, NOW())',
        [id, userId, text.trim()]
      );
      
      // Obtener el mensaje creado con información del usuario
      const messageQuery = `
        SELECT 
          cm.idMensaje as id,
          cm.contenido as text,
          cm.fechaEnvio as timestamp,
          u.nombre as userName,
          u.idUsuario as userId
        FROM comunidad_mensajes cm
        INNER JOIN usuarios u ON cm.idUsuario = u.idUsuario
        WHERE cm.idMensaje = ?
      `;
      
      const [newMessage] = await execute(messageQuery, [insertResult.insertId]);
      
      console.log('✅ Mensaje enviado exitosamente');
      
      res.status(201).json({
        success: true,
        data: {
          ...newMessage,
          isOwn: true,
          imagenes: []
        },
        message: 'Mensaje enviado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      });
    }
  }
};

module.exports = communitiesController;