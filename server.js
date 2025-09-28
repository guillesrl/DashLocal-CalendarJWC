const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const menuRoutes = require('./routes/menu');
const ordersRoutes = require('./routes/orders');
const reservationsRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reservations', reservationsRoutes);

// Servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Dashboard.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// Debug endpoint for Google Calendar configuration
app.get('/api/debug/calendar', (req, res) => {
    res.json({
        calendar_id: process.env.GOOGLE_CALENDAR_ID ? 'Configured' : 'Missing',
        service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configured' : 'Missing',
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'Configured' : 'Missing',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejamos las rutas de API
app.use('/api', (req, res, next) => {
    // Si llegamos aquí es porque ninguna ruta de API coincidió
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

// Para cualquier otra ruta, servir el frontend
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Dashboard.html'), (err) => {
        if (err) {
            res.status(404).send('Página no encontrada');
        }
    });
});

// Iniciar servidor
async function startServer() {
    try {
        // Probar conexión a la base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Servidor iniciando sin conexión a base de datos');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
            console.log(`📊 Dashboard disponible en http://localhost:${PORT}`);
            console.log(`🔍 Health check en http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();
