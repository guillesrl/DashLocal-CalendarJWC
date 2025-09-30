const { supabase } = require('../config/database');
require('dotenv').config();

async function initializeSupabaseDatabase() {
    try {
        console.log('Inicializando base de datos Supabase...');
        
        // Crear tabla de menú
        const { error: menuError } = await supabase.rpc('execute_sql', {
            query: `
                CREATE TABLE IF NOT EXISTS menu (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    precio DECIMAL(10,2) NOT NULL,
                    categoria VARCHAR(100),
                    ingredientes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `
        });
        
        if (menuError && !menuError.message.includes('already exists')) {
            console.error('Error creando tabla menu:', menuError);
        } else {
            console.log('✅ Tabla menu creada/verificada');
        }
        
        // Crear tabla de órdenes
        const { error: ordersError } = await supabase.rpc('execute_sql', {
            query: `
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    direccion VARCHAR(255) NOT NULL,
                    items JSONB NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `
        });
        
        if (ordersError && !ordersError.message.includes('already exists')) {
            console.error('Error creando tabla orders:', ordersError);
        } else {
            console.log('✅ Tabla orders creada/verificada');
        }
        
        // Crear tabla de reservas
        const { error: reservationsError } = await supabase.rpc('execute_sql', {
            query: `
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
            `
        });
        
        if (reservationsError && !reservationsError.message.includes('already exists')) {
            console.error('Error creando tabla reservations:', reservationsError);
        } else {
            console.log('✅ Tabla reservations creada/verificada');
        }
        
        // Crear índices
        await supabase.rpc('execute_sql', {
            query: `CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date)`
        });
        
        await supabase.rpc('execute_sql', {
            query: `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`
        });
        
        console.log('✅ Base de datos Supabase inicializada correctamente');
        console.log('Tablas creadas: menu, orders, reservations');
        
        // Verificar conexión con una consulta simple
        const { data, error } = await supabase.from('menu').select('count(*)').limit(1);
        if (error) {
            console.error('❌ Error verificando conexión:', error);
        } else {
            console.log('✅ Conexión a Supabase verificada');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos Supabase:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeSupabaseDatabase()
        .then(() => {
            console.log('Inicialización de Supabase completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { initializeSupabaseDatabase };
