// middleware/upload.js - Middleware para carga de imágenes
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Directorio para imágenes temporales
    const uploadDir = 'uploads/temp';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, 'reporte-' + uniqueName + extension);
  }
});

// Filtro para verificar tipo de archivo
const fileFilter = (req, file, cb) => {
  // Verificar si es imagen
  if (file.mimetype.startsWith('image/')) {
    // Extensiones permitidas
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen: JPG, PNG, GIF o WebP'), false);
    }
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

// Configuración multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

module.exports = upload;