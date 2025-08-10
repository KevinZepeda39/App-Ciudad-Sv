// models/User.js (Versión para MySQL usando Sequelize)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Modelo de Usuario para MySQL usando Sequelize
 */
const User = sequelize.define('User', {
  // ID del usuario (auto-incremental)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Información básica del usuario
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es obligatorio'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Formato de email no válido'
      },
      notEmpty: {
        msg: 'El email es obligatorio'
      }
    }
  },
  
  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La contraseña es obligatoria'
      },
      len: {
        args: [6, 100],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },
  
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active'
  },
  
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Datos adicionales
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Campos para reportes
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  lastReportDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
  
  // Campos createdAt y updatedAt se crean automáticamente con timestamps: true
}, {
  // Opciones del modelo
  tableName: 'users',
  timestamps: true,
  
  // Hooks (equivalente a pre-save middleware en Mongoose)
  hooks: {
    beforeCreate: async (user) => {
      // Hash de la contraseña antes de crearla
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Hash de la contraseña si se está actualizando
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Método para comparar contraseñas
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar token JWT
User.prototype.generateAuthToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role },
    process.env.JWT_SECRET || 'secreto_temporal',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = User;