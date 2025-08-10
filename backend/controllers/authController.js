// backend/controllers/authController.js - Authentication controller

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/db');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;

    // Check if email already exists
    const existingUser = await executeQuery(
      'SELECT * FROM usuarios WHERE correo = ?', 
      [correo]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El correo ya está registrado' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Insert new user
    const result = await executeQuery(
      'INSERT INTO usuarios (nombre, correo, contraseña) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email: correo },
      process.env.JWT_SECRET || 'miciudadsv_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertId,
        nombre,
        correo
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Find user by email
    const users = await executeQuery(
      'SELECT * FROM usuarios WHERE correo = ?', 
      [correo]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = users[0];

    // Validate password
    const isPasswordValid = await bcrypt.compare(contraseña, user.contraseña);

    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.idUsuario, email: user.correo },
      process.env.JWT_SECRET || 'miciudadsv_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        correo: user.correo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await executeQuery(
      'SELECT idUsuario, nombre, correo FROM usuarios WHERE idUsuario = ?', 
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor' 
    });
  }
};