// models/Report.js (Versión para MySQL usando Sequelize)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Conexión a tu base de datos
const User = require('./User');

/**
 * Modelo de Reportes para MySQL usando Sequelize
 */
const Report = sequelize.define('Report', {
  // ID del reporte (auto-incremental)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Información básica del reporte
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título es obligatorio'
      },
      len: {
        args: [1, 100],
        msg: 'El título no puede tener más de 100 caracteres'
      }
    }
  },
  
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La descripción es obligatoria'
      },
      len: {
        args: [1, 1000],
        msg: 'La descripción no puede tener más de 1000 caracteres'
      }
    }
  },
  
  // Relación con el usuario se establece más adelante con userId
  
  // Categoría del reporte
  category: {
    type: DataTypes.ENUM('General', 'Limpieza', 'Infraestructura', 'Seguridad', 'Tráfico', 'Alumbrado', 'Agua', 'Otro'),
    defaultValue: 'General'
  },
  
  // Estado del reporte
  status: {
    type: DataTypes.ENUM('Pendiente', 'En progreso', 'Verificado', 'Resuelto', 'Rechazado', 'Archivado'),
    defaultValue: 'Pendiente'
  },
  
  // Prioridad del reporte
  priority: {
    type: DataTypes.ENUM('Baja', 'Media', 'Alta', 'Urgente'),
    defaultValue: 'Media'
  },
  
  // Ubicación
  latitud: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  
  longitud: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Imagen del reporte
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Ruta al archivo de imagen
  imagenPath: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Tipo MIME de la imagen
  imagenMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Visibilidad del reporte
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // ID del funcionario asignado (puede ser null)
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // Notas administrativas
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Campos de auditoría manejados automáticamente por Sequelize con timestamps: true
}, {
  // Opciones del modelo
  tableName: 'reports',
  timestamps: true, // Crea automáticamente createdAt y updatedAt
  
  // Métodos de instancia
  instanceMethods: {
    canEdit(userId, userRole) {
      return this.userId === userId || userRole === 'admin';
    }
  }
});

// Relación con User (cada reporte pertenece a un usuario)
Report.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Relación con User para assignedToId (admin o funcionario asignado)
Report.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'assignedTo'
});

// Método para calcular el tiempo de resolución (en días)
Report.prototype.getResolutionTime = function() {
  if (this.status === 'Resuelto' && this.updatedAt && this.createdAt) {
    return (this.updatedAt - this.createdAt) / (1000 * 60 * 60 * 24);
  }
  return null;
};

module.exports = Report;