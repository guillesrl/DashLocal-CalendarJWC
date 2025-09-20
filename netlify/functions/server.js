console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY length:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.length : 'missing');
console.log('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY snippet:', process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.substring(0, 50) : 'missing');
console.log('Vercel Environment Variables:', {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'set' : 'missing',
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'set' : 'missing',
  GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID ? 'set' : 'missing',
  NODE_ENV: process.env.NODE_ENV
});
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('../../config/database');
const menuRoutes = require('../../routes/menu');
const ordersRoutes = require('../../routes/orders');
const reservationsRoutes = require('../../routes/reservations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../..')));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reservations', reservationsRoutes);

// Servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Dashboard.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'OK',
            database: dbConnected ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
});
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});


const GoogleCalendarBackendService = require('../../services/calendar-backend');

app.get('/api/debug/calendar-init', async (req, res) => {
    const calendarService = new GoogleCalendarBackendService();
    try {
        await calendarService.initialize();
        res.json({ status: 'success', message: 'Google Calendar service initialized successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
});
module.exports.handler = serverless(app);
