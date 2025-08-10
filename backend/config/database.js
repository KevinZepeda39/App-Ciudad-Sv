// backend/config/database.js - Todo en un archivo
const mysql = require('mysql2/promise');

// Configuración de la base de datos (solo opciones válidas)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'miciudadsv',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  charset: 'utf8mb4'
};

console.log('🔧 Configuración de Base de Datos:');
console.log(`📡 Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`🗃️ Database: ${dbConfig.database}`);
console.log(`👤 User: ${dbConfig.user}`);

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función helper para ejecutar queries
const execute = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error ejecutando query:', error.message);
    console.error('🔍 SQL:', sql);
    console.error('📊 Params:', params);
    throw error;
  }
};

// Función para verificar la conexión
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows[0]);
    
    // Verificar que las tablas existen
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas disponibles:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para asegurar que las columnas ubicacion y categoria existan
const ensureColumnsExist = async () => {
  try {
    console.log('🔍 Verificando columnas ubicacion y categoria...');
    
    // Verificar si existe la columna ubicacion
    const ubicacionExists = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND COLUMN_NAME = 'ubicacion' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (ubicacionExists.length === 0) {
      console.log('➕ Agregando columna ubicacion...');
      await execute(`
        ALTER TABLE reportes 
        ADD COLUMN ubicacion VARCHAR(255) AFTER descripcion
      `);
      console.log('✅ Columna ubicacion agregada');
    } else {
      console.log('✅ Columna ubicacion ya existe');
    }
    
    // Verificar si existe la columna categoria
    const categoriaExists = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND COLUMN_NAME = 'categoria' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (categoriaExists.length === 0) {
      console.log('➕ Agregando columna categoria...');
      await execute(`
        ALTER TABLE reportes 
        ADD COLUMN categoria ENUM('general', 'infraestructura', 'limpieza', 'seguridad', 'alumbrado', 'agua') DEFAULT 'general' AFTER ubicacion
      `);
      console.log('✅ Columna categoria agregada');
    } else {
      console.log('✅ Columna categoria ya existe');
    }
    
    // Verificar y agregar índices si no existen
    try {
      const categoriaIndex = await execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'reportes' 
        AND INDEX_NAME = 'idx_categoria' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (categoriaIndex.length === 0) {
        await execute(`ALTER TABLE reportes ADD INDEX idx_categoria (categoria)`);
        console.log('✅ Índice idx_categoria creado');
      } else {
        console.log('✅ Índice idx_categoria ya existe');
      }
      
      const ubicacionIndex = await execute(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_NAME = 'reportes' 
        AND INDEX_NAME = 'idx_ubicacion' 
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if (ubicacionIndex.length === 0) {
        await execute(`ALTER TABLE reportes ADD INDEX idx_ubicacion (ubicacion)`);
        console.log('✅ Índice idx_ubicacion creado');
      } else {
        console.log('✅ Índice idx_ubicacion ya existe');
      }
      
    } catch (error) {
      console.log('ℹ️ Información sobre índices:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error verificando columnas:', error.message);
    // No lanzar error aquí, continuar con la inicialización
  }
};

// Función para verificar estructura de tablas existentes
const verifyTablesStructure = async () => {
  try {
    console.log('🔍 Verificando estructura de tablas existentes...');
    
    // Verificar tabla reportes
    const reportesColumns = await execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'reportes' 
      AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `);
    
    if (reportesColumns.length > 0) {
      console.log('✅ Tabla "reportes" encontrada con columnas:');
      reportesColumns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
      
      // Verificar si las nuevas columnas existen
      await ensureColumnsExist();
    } else {
      console.log('⚠️ Tabla "reportes" no encontrada');
    }
    
    // Verificar tabla usuarios
    const usuariosColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'usuarios' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (usuariosColumns.length > 0) {
      console.log('✅ Tabla "usuarios" encontrada');
    } else {
      console.log('ℹ️ Tabla "usuarios" no encontrada (opcional)');
    }
    
    // Verificar tabla usuario_reporte
    const usuarioReporteColumns = await execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'usuario_reporte' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (usuarioReporteColumns.length > 0) {
      console.log('✅ Tabla "usuario_reporte" encontrada');
    } else {
      console.log('ℹ️ Tabla "usuario_reporte" no encontrada (opcional)');
    }
    
    console.log('✅ Verificación de estructura completada\n');
    
  } catch (error) {
    console.error('❌ Error verificando estructura de tablas:', error.message);
    // No lanzar error, continuar
  }
};

// Función helper para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Función principal de conexión
const connectDB = async () => {
  try {
    console.log('\n🔄 ===== INICIANDO CONEXIÓN A BASE DE DATOS =====');
    console.log('🔄 Iniciando conexión a la base de datos...');
    
    const isConnected = await checkConnection();
    
    if (isConnected) {
      console.log('✅ Base de datos MySQL conectada exitosamente');
      
      // Verificar estructura de tablas existentes
      await verifyTablesStructure();
      
      console.log('🎉 ===== BASE DE DATOS LISTA =====\n');
      return true;
    } else {
      console.log('❌ No se pudo establecer conexión con la base de datos');
      throw new Error('Falló la conexión a la base de datos');
    }
  } catch (error) {
    console.error('❌ Error en connectDB:', error.message);
    
    // En modo desarrollo, continuar sin base de datos
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Modo desarrollo: continuando sin base de datos...');
      return false;
    } else {
      // En producción, terminar la aplicación
      console.log('❌ Modo producción: terminando aplicación por error de BD');
      process.exit(1);
    }
  }
};

// Función de cierre elegante
const closeConnection = async () => {
  try {
    console.log('\n🔄 Cerrando conexiones de base de datos...');
    await pool.end();
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error.message);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

// Exportar la función connectDB como default export
module.exports = connectDB;

// También exportar las otras funciones
module.exports.pool = pool;
module.exports.execute = execute;
module.exports.transaction = transaction;
module.exports.checkConnection = checkConnection;
module.exports.closeConnection = closeConnection;