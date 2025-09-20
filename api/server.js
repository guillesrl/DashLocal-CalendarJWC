const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const { testConnection } = require('../config/database');
const menuRoutes = require('../routes/menu');
const ordersRoutes = require('../routes/orders');
const reservationsRoutes = require('../routes/reservations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reservations', reservationsRoutes);

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
        const GoogleCalendarBackendService = require('../services/calendar-backend');
        const calendarService = new GoogleCalendarBackendService();
        await calendarService.initialize();
        res.json({ status: 'success', message: 'Google Calendar service initialized successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

module.exports = app;
