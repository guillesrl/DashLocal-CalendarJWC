console.log('🚀 Iniciando servidor...');

const path = require('path');

// Cargar variables de entorno primero
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

// Verificar variables de entorno críticas
console.log('🔍 Verificando variables de entorno...');
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'GOOGLE_CALENDAR_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`❌ Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
    process.exit(1);
}

// Configuración de variables de entorno
console.log('🔍 Verificando variables de entorno...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No configurada');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Configurada' : '❌ No configurada');
console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID ? '✅ Configurada' : '❌ No configurada');

// Import database configuration
console.log('🔄 Importando configuración de base de datos...');
try {
    const { testConnection, supabase } = require('./config/database');
    console.log('✅ Módulo de base de datos importado correctamente');
} catch (error) {
    console.error('❌ Error al importar el módulo de base de datos:', error);
    process.exit(1);
}

// Import routes
console.log('🔄 Importando rutas...');
let menuRoutes, ordersRoutes, reservationsRoutes;
try {
    menuRoutes = require('./routes/menu');
    ordersRoutes = require('./routes/orders');
    reservationsRoutes = require('./routes/reservations');
    console.log('✅ Rutas importadas correctamente');
} catch (error) {
    console.error('❌ Error al importar las rutas:', error);
    process.exit(1);
}

const app = express();

// Middleware
console.log('🛠️ Configurando middleware...');
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de registro de solicitudes
app.use((req, res, next) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reservations', reservationsRoutes);



// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        console.log('🩺 Realizando health check...');
        let dbConnected = false;
        let dbError = null;
        
        try {
            dbConnected = await testConnection();
            console.log('✅ Conexión a la base de datos:', dbConnected ? '✅ Conectado' : '❌ Desconectado');
        } catch (error) {
            console.error('❌ Error en la conexión a la base de datos:', error);
            dbError = error.message;
        }
        
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            database: {
                connected: dbConnected,
                error: dbError,
                url: process.env.SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'
            },
            services: {
                googleCalendar: {
                    configured: !!process.env.GOOGLE_CALENDAR_ID,
                    calendarId: process.env.GOOGLE_CALENDAR_ID || 'No configurado'
                }
            },
            memoryUsage: process.memoryUsage()
        };
        
        console.log('📊 Estado del servidor:', JSON.stringify(healthCheck, null, 2));
        
        res.json(healthCheck);
    } catch (error) {
        console.error('❌ Error en el health check:', error);
        res.status(500).json({
            status: 'Error',
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
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

// Google Calendar debug endpoint
app.get('/api/debug/calendar-init', async (req, res) => {
    try {
        const GoogleCalendarBackendService = require('./services/calendar-backend');
        const calendarService = new GoogleCalendarBackendService();
        await calendarService.initialize();
        res.json({ status: 'success', message: 'Google Calendar service initialized successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
});

// Servir el archivo index.html para cualquier otra ruta (para SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});

// Manejo de cierre correcto del servidor
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
    server.close(() => {
        console.log('👋 Servidor cerrado');
        process.exit(0);
    });
});

module.exports = app;
