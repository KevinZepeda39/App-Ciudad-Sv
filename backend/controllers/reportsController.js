// controllers/reportesController.js - Adaptado a tu base de datos actual
const db = require('../config/db.js');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const reportesController = {
  /**
   * Obtiene todos los reportes
   * @route GET /api/reportes
   */
  obtenerReportes: async (req, res) => {
    try {
      // Parámetros de paginación
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = parseInt(req.query.limite) || 10;
      const inicio = (pagina - 1) * limite;
      
      // Consulta SQL para obtener reportes con información del usuario
      const query = `
        SELECT r.*, u.nombre as nombreUsuario 
        FROM reportes r 
        LEFT JOIN usuario_reporte ur ON r.idReporte = ur.idReporte 
        LEFT JOIN usuarios u ON ur.idUsuario = u.idUsuario 
        WHERE ur.rolEnReporte = 'creador' 
        ORDER BY r.fechaCreacion DESC 
        LIMIT ? OFFSET ?
      `;
      
      // Ejecutar consulta principal
      const [reportes] = await db.pool.execute(query, [limite, inicio]);
      
      // Consulta para contar total de reportes
      const [totalReportes] = await db.pool.execute(
        'SELECT COUNT(*) as total FROM reportes'
      );
      
      return res.status(200).json({
        exito: true,
        datos: reportes,
        paginacion: {
          total: totalReportes[0].total,
          pagina,
          paginas: Math.ceil(totalReportes[0].total / limite),
          limite
        }
      });
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener reportes',
        error: error.message
      });
    }
  },

  /**
   * Obtiene un reporte específico por ID
   * @route GET /api/reportes/:id
   */
  obtenerReportePorId: async (req, res) => {
    try {
      const idReporte = req.params.id;
      
      // Consulta SQL para obtener reporte con información del usuario creador
      const query = `
        SELECT r.*, u.nombre as nombreUsuario, u.correo as correoUsuario
        FROM reportes r 
        LEFT JOIN usuario_reporte ur ON r.idReporte = ur.idReporte 
        LEFT JOIN usuarios u ON ur.idUsuario = u.idUsuario 
        WHERE r.idReporte = ? AND ur.rolEnReporte = 'creador'
      `;
      
      const [reportes] = await db.pool.execute(query, [idReporte]);
      
      if (reportes.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Reporte no encontrado'
        });
      }
      
      // Convertir la imagen BLOB a base64 si existe
      const reporte = reportes[0];
      if (reporte.imagen) {
        // Convertir Buffer a string base64
        reporte.imagenBase64 = `data:${reporte.tipoImagen};base64,${Buffer.from(reporte.imagen).toString('base64')}`;
        // Eliminar el blob de la respuesta para evitar datos muy grandes
        delete reporte.imagen;
      }
      
      return res.status(200).json({
        exito: true,
        datos: reporte
      });
    } catch (error) {
      console.error('Error al obtener reporte por ID:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener detalles del reporte',
        error: error.message
      });
    }
  },

  /**
   * Crea un nuevo reporte
   * @route POST /api/reportes
   */
  crearReporte: async (req, res) => {
    try {
      // Validar datos de entrada
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos inválidos',
          errores: errores.array()
        });
      }
      
      // Obtener datos del cuerpo de la solicitud
      const { titulo, descripcion } = req.body;
      
      // Datos de la imagen si existe
      let imagenBuffer = null;
      let nombreImagen = null;
      let tipoImagen = null;
      
      if (req.file) {
        // Convertir archivo a Buffer
        imagenBuffer = fs.readFileSync(req.file.path);
        nombreImagen = req.file.filename;
        tipoImagen = req.file.mimetype;
        
        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);
      }
      
      // Iniciar transacción
      const connection = await db.pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Insertar en la tabla reportes
        const [resultado] = await connection.execute(
          'INSERT INTO reportes (titulo, descripcion, imagen, nombreImagen, tipoImagen) VALUES (?, ?, ?, ?, ?)',
          [titulo, descripcion, imagenBuffer, nombreImagen, tipoImagen]
        );
        
        const idReporte = resultado.insertId;
        
        // Vincular con el usuario (relación usuario_reporte)
        await connection.execute(
          'INSERT INTO usuario_reporte (idUsuario, idReporte, rolEnReporte) VALUES (?, ?, ?)',
          [req.usuario.idUsuario, idReporte, 'creador']
        );
        
        // Confirmar transacción
        await connection.commit();
        
        // Preparar respuesta sin incluir el blob de imagen
        const nuevoReporte = {
          idReporte,
          titulo,
          descripcion,
          nombreImagen,
          tipoImagen,
          fechaCreacion: new Date()
        };
        
        return res.status(201).json({
          exito: true,
          mensaje: 'Reporte creado exitosamente',
          datos: nuevoReporte
        });
      } catch (error) {
        // Revertir transacción en caso de error
        await connection.rollback();
        throw error;
      } finally {
        // Liberar conexión
        connection.release();
      }
    } catch (error) {
      console.error('Error al crear reporte:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al crear reporte',
        error: error.message
      });
    }
  },

  /**
   * Actualiza un reporte existente
   * @route PUT /api/reportes/:id
   */
  actualizarReporte: async (req, res) => {
    try {
      const idReporte = req.params.id;
      const { titulo, descripcion } = req.body;
      
      // Verificar si el reporte existe y si el usuario es el creador
      const [reporteUsuario] = await db.pool.execute(
        `SELECT ur.* FROM usuario_reporte ur 
         WHERE ur.idReporte = ? AND ur.idUsuario = ? AND ur.rolEnReporte = 'creador'`,
        [idReporte, req.usuario.idUsuario]
      );
      
      if (reporteUsuario.length === 0) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permiso para actualizar este reporte'
        });
      }
      
      // Consultar reporte actual para obtener información de la imagen
      const [reporteActual] = await db.pool.execute(
        'SELECT * FROM reportes WHERE idReporte = ?',
        [idReporte]
      );
      
      if (reporteActual.length === 0) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Reporte no encontrado'
        });
      }
      
      // Datos actualizados para la imagen
      let imagenBuffer = reporteActual[0].imagen;
      let nombreImagen = reporteActual[0].nombreImagen;
      let tipoImagen = reporteActual[0].tipoImagen;
      
      // Si hay un nuevo archivo
      if (req.file) {
        // Convertir nuevo archivo a Buffer
        imagenBuffer = fs.readFileSync(req.file.path);
        nombreImagen = req.file.filename;
        tipoImagen = req.file.mimetype;
        
        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);
      }
      
      // Actualizar el reporte
      await db.pool.execute(
        'UPDATE reportes SET titulo = ?, descripcion = ?, imagen = ?, nombreImagen = ?, tipoImagen = ? WHERE idReporte = ?',
        [titulo, descripcion, imagenBuffer, nombreImagen, tipoImagen, idReporte]
      );
      
      return res.status(200).json({
        exito: true,
        mensaje: 'Reporte actualizado exitosamente',
        datos: {
          idReporte,
          titulo,
          descripcion,
          nombreImagen,
          tipoImagen
        }
      });
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al actualizar reporte',
        error: error.message
      });
    }
  },

  /**
   * Elimina un reporte
   * @route DELETE /api/reportes/:id
   */
  eliminarReporte: async (req, res) => {
    try {
      const idReporte = req.params.id;
      
      // Verificar si el reporte existe y si el usuario es el creador
      const [reporteUsuario] = await db.pool.execute(
        `SELECT ur.* FROM usuario_reporte ur 
         WHERE ur.idReporte = ? AND ur.idUsuario = ? AND ur.rolEnReporte = 'creador'`,
        [idReporte, req.usuario.idUsuario]
      );
      
      if (reporteUsuario.length === 0) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permiso para eliminar este reporte'
        });
      }
      
      // El reporte se eliminará automáticamente de usuario_reporte por la restricción de clave foránea ON DELETE CASCADE
      await db.pool.execute(
        'DELETE FROM reportes WHERE idReporte = ?',
        [idReporte]
      );
      
      return res.status(200).json({
        exito: true,
        mensaje: 'Reporte eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al eliminar reporte',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene la imagen de un reporte específico
   * @route GET /api/reportes/:id/imagen
   */
  obtenerImagenReporte: async (req, res) => {
    try {
      const idReporte = req.params.id;
      
      // Consultar la imagen del reporte
      const [reportes] = await db.pool.execute(
        'SELECT imagen, tipoImagen FROM reportes WHERE idReporte = ?',
        [idReporte]
      );
      
      if (reportes.length === 0 || !reportes[0].imagen) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Imagen no encontrada'
        });
      }
      
      // Configurar cabeceras para la imagen
      res.setHeader('Content-Type', reportes[0].tipoImagen);
      
      // Enviar la imagen como respuesta
      return res.send(reportes[0].imagen);
    } catch (error) {
      console.error('Error al obtener imagen de reporte:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al obtener imagen',
        error: error.message
      });
    }
  }
};

module.exports = reportesController;