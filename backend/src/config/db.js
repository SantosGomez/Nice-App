import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Pool de conexiones a la base de datos MySQL/MariaDB.
 * Permite reutilizar conexiones abiertas de forma eficiente, evitando
 * el overhead de abrir y cerrar conexiones en cada petición HTTP.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nice_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Función para probar y verificar la conexión a la base de datos.
 * Se ejecuta al iniciar el servidor para detectar problemas de configuración temprano.
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Database] Conexión exitosa a MySQL (Base de datos: ' + (process.env.DB_NAME || 'nice_app') + ')');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Database] Error al conectar con la base de datos:', error.message);
    return false;
  }
}

export default pool;
