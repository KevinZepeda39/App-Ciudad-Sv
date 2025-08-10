// backend/routes/users.js - User routes

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { executeQuery } = require('../config/db');

// Get all users (admin only)
router.get('/', authenticateUser, async (req, res) => {
  try {
    // In a real app, you would check if the user is an admin here
    
    const users = await executeQuery(
      'SELECT idUsuario, nombre, correo FROM usuarios'
    );
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
});

module.exports = router;