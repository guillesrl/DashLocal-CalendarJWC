require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');

// Configure Google Auth using credentials file or environment variables
let auth = null;

try {
  // First try to use credentials file if path is provided
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    const fs = require('fs');
    const path = require('path');
    const credentialsPath = path.resolve(__dirname, '..', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    
    if (fs.existsSync(credentialsPath)) {
      console.log('📁 Loading Google credentials from file:', credentialsPath);
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      console.log('✅ Google Calendar credentials loaded from file');
    } else {
      console.warn('⚠️ Credentials file not found:', credentialsPath);
    }
  }
  // Fallback to environment variables
  else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    
    auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    console.log('✅ Google Calendar credentials loaded from environment variables');
  } else {
    console.warn('⚠️ Google Calendar credentials not configured');
  }
} catch (error) {
  console.error('❌ Error configuring Google Auth:', error.message);
}

const router = express.Router();
const { supabase } = require('../config/database');

// GET /api/orders - Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filtrar por fecha si se proporciona
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      query = query
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Formatear los datos para el frontend
    const formattedData = data.map(order => ({
      ...order,
      items: Array.isArray(order.items) ? order.items.join(', ') : order.items,
      customer_name: order.nombre,
      phone: order.telefono,
      status: order.status || 'pendiente'
    }));
    
    res.json({ data: formattedData });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/orders - Crear nueva orden
router.post('/', async (req, res) => {
  try {
    const { direccion, items, total, nombre, telefono } = req.body;
    if (!direccion || !items || !total || !nombre || !telefono) {
      return res.status(400).json({ error: 'Dirección, items, total, nombre y teléfono son requeridos' });
    }
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        direccion,
        items: JSON.stringify(items),
        total,
        nombre,
        telefono
      }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/orders/:id - Actualizar orden
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { direccion, items, total, status, nombre, telefono } = req.body;
    if (!direccion || !items || !total || !nombre || !telefono) {
      return res.status(400).json({ error: 'Dirección, items, total, nombre y teléfono son requeridos' });
    }
    const { data, error } = await supabase
      .from('orders')
      .update({
        direccion,
        items: JSON.stringify(items),
        total,
        status,
        nombre,
        telefono,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/orders/today - Obtener reservas de hoy
router.get('/today', async (req, res) => {
  try {
    if (!auth) {
      return res.status(503).json({ 
        error: 'Google Calendar service not configured',
        message: 'Please configure Google Calendar credentials'
      });
    }
    
    const calendar = google.calendar('v3');
    const client = await auth.getClient();

    // Use calendar ID from env or default to 'primary'
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log(`Using calendar ID: ${calendarId}`);

    // Calculate start and end of today in ISO string with timezone offset
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000; // in ms
    const startOfDay = new Date(now.getTime() - timezoneOffset);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();

    console.log(`Fetching events from ${timeMin} to ${timeMax}`);

    const events = await calendar.events.list({
      auth: client,
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log(`Found ${events.data.items.length} events`);

    res.json(events.data.items);
  } catch (error) {
    console.error('Error obteniendo reservas de hoy:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/orders/:id - Eliminar orden
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      throw error;
    }
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/orders/:id - Actualizar estado de la orden
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'El estado es requerido' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error actualizando estado de la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
