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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Insertar datos de ejemplo en orders
INSERT INTO orders (direccion, items, total, status) VALUES
('Calle Mayor 123, Madrid', '["Pizza Margherita", "Coca Cola"]', 15.49, 'pendiente'),
('Avenida Gran Vía 45, Madrid', '["Pasta Carbonara", "Agua Mineral"]', 16.49, 'servido')
ON CONFLICT DO NOTHING;

-- Insertar datos de ejemplo en reservations
INSERT INTO reservations (customer_name, phone, date, time, people, table_number) VALUES
('Juan Pérez', '+34 666 123 456', CURRENT_DATE + INTERVAL '1 day', '20:00', 4, 1),
('María García', '+34 677 987 654', CURRENT_DATE + INTERVAL '2 days', '21:30', 2, 3)
ON CONFLICT DO NOTHING;
