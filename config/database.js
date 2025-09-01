const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Manejar errores de conexión
pool.on('error', (err, client) => {
    console.error('Error inesperado en cliente de base de datos:', err);
    process.exit(-1);
});

// Función para probar la conexión
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión a PostgreSQL establecida correctamente');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
