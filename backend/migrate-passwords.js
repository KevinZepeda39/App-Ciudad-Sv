// backend/migrate-passwords.js - Script para migrar contraseñas existentes
const bcrypt = require('bcrypt');
const { execute, pool } = require('./config/database');

const SALT_ROUNDS = 10;

async function migratePasswords() {
  console.log('🔄 === MIGRATING EXISTING PASSWORDS TO BCRYPT ===');
  
  try {
    // Obtener todos los usuarios con contraseñas en texto plano
    const users = await execute(
      'SELECT idUsuario, nombre, correo, contraseña FROM usuarios WHERE contraseña NOT LIKE "$2%"'
    );
    
    console.log(`📋 Found ${users.length} users with plain text passwords`);
    
    if (users.length === 0) {
      console.log('✅ All passwords are already encrypted!');
      return;
    }
    
    let migratedCount = 0;
    
    for (const user of users) {
      try {
        console.log(`🔐 Migrating password for user: ${user.nombre} (${user.correo})`);
        
        // Encriptar la contraseña actual
        const hashedPassword = await bcrypt.hash(user.contraseña, SALT_ROUNDS);
        
        // Actualizar en la base de datos
        await execute(
          'UPDATE usuarios SET contraseña = ?, fechaActualizacion = NOW() WHERE idUsuario = ?',
          [hashedPassword, user.idUsuario]
        );
        
        console.log(`✅ Password migrated for user ID ${user.idUsuario}`);
        migratedCount++;
        
      } catch (userError) {
        console.error(`❌ Error migrating password for user ${user.idUsuario}:`, userError);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} passwords`);
    console.log(`❌ Failed migrations: ${users.length - migratedCount}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Ejecutar migración si se ejecuta directamente
if (require.main === module) {
  migratePasswords();
}

module.exports = { migratePasswords };