// backend/routes/reports.js
const express = require('express');
const multer = require('multer');
const { execute } = require('../config/database');

const router = express.Router();

// Configuración de multer para imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// 📋 Obtener todos los reportes
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /api/reports - Obteniendo reportes...');
    
    const query = `
      SELECT 
        idReporte,
        titulo,
        descripcion,
        nombreImagen,
        tipoImagen,
        fechaCreacion
      FROM reportes 
      ORDER BY fechaCreacion DESC
    `;
    
    const result = await execute(query);
    
    console.log(`✅ Reportes obtenidos: ${result.length}`);
    
    res.json({
      success: true,
      reports: result.map(report => ({
        id: report.idReporte,
        title: report.titulo,
        description: report.descripcion,
        imageName: report.nombreImagen,
        imageType: report.tipoImagen,
        createdAt: report.fechaCreacion,
        hasImage: !!report.nombreImagen
      }))
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes',
      error: error.message
    });
  }
});

// 📤 Crear nuevo reporte
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('📡 POST /api/reports - Creando reporte...');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'Imagen presente' : 'Sin imagen');
    
    const { title, description } = req.body;
    
    // Validación
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Título y descripción son requeridos'
      });
    }
    
    let query, params;
    
    if (req.file) {
      // Con imagen
      query = `
        INSERT INTO reportes 
        (titulo, descripcion, imagen, nombreImagen, tipoImagen, fechaCreacion) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      params = [
        title,
        description,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      ];
    } else {
      // Sin imagen
      query = `
        INSERT INTO reportes 
        (titulo, descripcion, fechaCreacion) 
        VALUES (?, ?, NOW())
      `;
      params = [title, description];
    }
    
    const result = await execute(query, params);
    
    console.log(`✅ Reporte creado con ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: 'Reporte creado exitosamente',
      report: {
        id: result.insertId,
        title,
        description,
        hasImage: !!req.file
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear reporte',
      error: error.message
    });
  }
});

// 🖼️ Obtener imagen de reporte
router.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 GET /api/reports/${id}/image - Obteniendo imagen...`);
    
    const query = `
      SELECT imagen, tipoImagen 
      FROM reportes 
      WHERE idReporte = ?
    `;
    
    const result = await execute(query, [id]);
    
    if (result.length === 0 || !result[0].imagen) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }
    
    const report = result[0];
    res.set({
      'Content-Type': report.tipoImagen,
      'Content-Length': report.imagen.length
    });
    
    res.send(report.imagen);
    
  } catch (error) {
    console.error('❌ Error obteniendo imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener imagen'
    });
  }
});

// 🗑️ Eliminar reporte
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 DELETE /api/reports/${id} - Eliminando reporte...`);
    
    const query = 'DELETE FROM reportes WHERE idReporte = ?';
    const result = await execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }
    
    console.log(`✅ Reporte ${id} eliminado`);
    
    res.json({
      success: true,
      message: 'Reporte eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reporte'
    });
  }
});

// 🔍 Obtener reporte específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 GET /api/reports/${id} - Obteniendo reporte específico...`);
    
    const query = `
      SELECT 
        idReporte,
        titulo,
        descripcion,
        nombreImagen,
        tipoImagen,
        fechaCreacion
      FROM reportes 
      WHERE idReporte = ?
    `;
    
    const result = await execute(query, [id]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }
    
    const report = result[0];
    
    res.json({
      success: true,
      report: {
        id: report.idReporte,
        title: report.titulo,
        description: report.descripcion,
        imageName: report.nombreImagen,
        imageType: report.tipoImagen,
        createdAt: report.fechaCreacion,
        hasImage: !!report.nombreImagen
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte'
    });
  }
});


// backend/routes/reports.js - AGREGAR esta ruta PUT después de las existentes

// ✏️ Actualizar reporte existente
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    console.log(`📡 PUT /api/reports/${id} - Actualizando reporte...`);
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'Nueva imagen presente' : 'Sin nueva imagen');
    
    // Validación
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Título y descripción son requeridos'
      });
    }
    
    // Verificar si el reporte existe
    const checkQuery = 'SELECT * FROM reportes WHERE idReporte = ?';
    const existing = await execute(checkQuery, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }
    
    let query, params;
    
    if (req.file) {
      // Actualizar con nueva imagen
      query = `
        UPDATE reportes 
        SET titulo = ?, descripcion = ?, imagen = ?, nombreImagen = ?, tipoImagen = ?
        WHERE idReporte = ?
      `;
      params = [
        title,
        description,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        id
      ];
    } else {
      // Actualizar solo texto (mantener imagen existente)
      query = `
        UPDATE reportes 
        SET titulo = ?, descripcion = ?
        WHERE idReporte = ?
      `;
      params = [title, description, id];
    }
    
    const result = await execute(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }
    
    console.log(`✅ Reporte ${id} actualizado exitosamente`);
    
    res.json({
      success: true,
      message: 'Reporte actualizado exitosamente',
      data: {
        id: parseInt(id),
        title,
        description,
        hasImage: !!req.file || !!existing[0].nombreImagen
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar reporte',
      error: error.message
    });
  }
});

module.exports = router;