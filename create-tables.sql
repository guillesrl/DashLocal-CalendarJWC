-- Script SQL para crear las tablas del dashboard de restaurante
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- Crear tabla menu_items
CREATE TABLE IF NOT EXISTS menu (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    ingredientes TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    direccion VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla reservations
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
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(categoria);

-- Insertar datos de ejemplo en menu
INSERT INTO menu (nombre, precio, categoria, ingredientes) VALUES
('Pizza Margherita', 12.99, 'platos-principales', 'Pizza clásica con tomate, mozzarella y albahaca'),
('Ensalada César', 8.50, 'entradas', 'Lechuga romana, parmesano, crutones y aderezo césar'),
('Pasta Carbonara', 14.99, 'platos-principales', 'Pasta con huevo, panceta, parmesano y pimienta negra'),
('Hamburguesa Clásica', 11.50, 'platos-principales', 'Hamburguesa de carne con lechuga, tomate y queso'),
('Sopa del Día', 6.99, 'entradas', 'Sopa casera preparada diariamente'),
('Tiramisu', 6.99, 'postres', 'Postre italiano con café, mascarpone y cacao'),
('Cheesecake', 5.99, 'postres', 'Tarta de queso con base de galleta'),
('Coca Cola', 2.50, 'bebidas', 'Refresco de cola 330ml'),
('Agua Mineral', 1.50, 'bebidas', 'Agua mineral natural 500ml'),
('Cerveza', 3.50, 'bebidas', 'Cerveza nacional 330ml')
ON CONFLICT DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT 'menu' as tabla, COUNT(*) as registros FROM menu
UNION ALL
SELECT 'orders' as tabla, COUNT(*) as registros FROM orders
UNION ALL
SELECT 'reservations' as tabla, COUNT(*) as registros FROM reservations;
