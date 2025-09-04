const { pool } = require('../config/database');
require('dotenv').config();

async function initializeDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('Inicializando base de datos PostgreSQL...');
        
        // Crear tabla de menú
        await client.query(`
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Crear tabla de órdenes
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                direccion VARCHAR(255) NOT NULL,
                items JSONB NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Migrar datos existentes de table_number a direccion si la columna existe
        await client.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_number') THEN
                    ALTER TABLE orders ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
                    UPDATE orders SET direccion = CONCAT('Mesa ', table_number) WHERE direccion IS NULL;
                    ALTER TABLE orders DROP COLUMN IF EXISTS table_number;
                END IF;
            END $$;
        `);
        
        // Crear tabla de reservas
        await client.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                date DATE NOT NULL,
                time TIME NOT NULL,
                people INTEGER NOT NULL,
                table_number INTEGER,
                status VARCHAR(50) DEFAULT 'confirmed',
                google_event_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Crear índices para mejor rendimiento
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        `);
        
        console.log('✅ Base de datos PostgreSQL inicializada correctamente');
        console.log('Tablas creadas: menu_items, orders, reservations');
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Inicialización completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
