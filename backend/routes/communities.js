// backend/routes/communities.js
const express = require('express');
const router = express.Router();
const communitiesController = require('../controllers/communitiesController');

// Middleware simple de autenticación (temporal)
const authMiddleware = (req, res, next) => {
  // Por ahora, simular que siempre hay un usuario logueado
  req.user = {
    idUsuario: 1,
    nombre: 'Usuario Prueba'
  };
  next();
};

// Rutas principales
router.get('/', authMiddleware, communitiesController.getAllCommunities);
router.get('/user', authMiddleware, communitiesController.getUserCommunities);
router.post('/', authMiddleware, communitiesController.createCommunity);
router.post('/action', authMiddleware, communitiesController.toggleMembership);

// Rutas específicas de comunidad
router.get('/:id', authMiddleware, communitiesController.getCommunityDetails);
router.get('/:id/messages', authMiddleware, communitiesController.getCommunityMessages);
router.post('/:id/messages', authMiddleware, communitiesController.sendMessage);

// Ruta de prueba
router.get('/test/connection', (req, res) => {
  console.log('🔍 Test de conexión a comunidades');
  res.json({
    success: true,
    message: 'API de comunidades funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;