// backend/routes/auth.js - Versión simplificada
const express = require('express');
const router = express.Router();

// Ruta simple de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Login básico
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    user: { id: 1, email, name: 'Test User' },
    token: 'mock_token'
  });
});

module.exports = router;