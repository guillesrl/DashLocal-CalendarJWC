const { Pool } = require('pg');
require('dotenv').config();

async function createTablesWithPostgreSQL() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    console.log('🔧 Creando tablas usando PostgreSQL directo...');
    
    try {
        const client = await pool.connect();
        console.log('✅ Conectado a PostgreSQL');
        
        // Crear tabla menu
        console.log('\n📋 Creando tabla menu...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS menu (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                categoria VARCHAR(100),
                ingredientes TEXT,
                stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla menu creada');
        
        // Crear tabla orders
        console.log('\n📋 Creando tabla orders...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                direccion VARCHAR(255) NOT NULL,
                items JSONB NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pendiente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla orders creada');
        
        // Crear tabla reservations
        console.log('\n📋 Creando tabla reservations...');
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
        console.log('✅ Tabla reservations creada');
        
        // Crear índices
        console.log('\n📋 Creando índices...');
        await client.query(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
        console.log('✅ Índices creados');
        
        // Insertar datos de ejemplo en menu
        console.log('\n🍽️ Insertando datos de ejemplo en menu...');
        const menuResult = await client.query('SELECT COUNT(*) FROM menu');
        const menuCount = parseInt(menuResult.rows[0].count);
        
        if (menuCount === 0) {
            await client.query(`
                INSERT INTO menu (nombre, precio, categoria, ingredientes, stock) VALUES
                ('Pizza Margherita', 12.99, 'platos-principales', 'Pizza clásica con tomate, mozzarella y albahaca', 10),
                ('Ensalada César', 8.50, 'entradas', 'Lechuga romana, parmesano, crutones y aderezo césar', 15),
                ('Pasta Carbonara', 14.99, 'platos-principales', 'Pasta con huevo, panceta, parmesano y pimienta negra', 12),
                ('Tiramisu', 6.99, 'postres', 'Postre italiano con café, mascarpone y cacao', 20),
                ('Coca Cola', 2.50, 'bebidas', 'Refresco de cola 330ml', 50),
                ('Agua Mineral', 1.50, 'bebidas', 'Agua mineral natural 500ml', 50)
            `);
            console.log('✅ Datos de ejemplo insertados en menu');
        } else {
            console.log(`ℹ️  Menu ya tiene ${menuCount} items`);
        }
        
        // Verificar tablas creadas
        console.log('\n🔍 Verificando tablas creadas...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('menu', 'orders', 'reservations')
            ORDER BY table_name
        `);
        
        console.log('📊 Tablas encontradas:');
        tablesResult.rows.forEach(row => {
            console.log(`  ✅ ${row.table_name}`);
        });
        
        // Contar registros en cada tabla
        const menuCountResult = await client.query('SELECT COUNT(*) FROM menu');
        const ordersCountResult = await client.query('SELECT COUNT(*) FROM orders');
        const reservationsCountResult = await client.query('SELECT COUNT(*) FROM reservations');
        
        console.log('\n📈 Registros por tabla:');
        console.log(`  menu: ${menuCountResult.rows[0].count}`);
        console.log(`  orders: ${ordersCountResult.rows[0].count}`);
        console.log(`  reservations: ${reservationsCountResult.rows[0].count}`);
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTablesWithPostgreSQL()
        .then(() => {
            console.log('\n🎉 Tablas creadas exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { createTablesWithPostgreSQL };
