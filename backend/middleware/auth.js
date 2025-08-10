// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }
    
    // Verificar que el token comience con "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }
    
    // Extraer el token
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secret_key_aqui');
    
    // Agregar la información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = auth;