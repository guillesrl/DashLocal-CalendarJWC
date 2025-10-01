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
    const { startDate, endDate } = req.query;
    let query = supabase
      .from('orders')
      .select('id, created_at, nombre, total, status, items, telefono, direccion')
      .order('created_at', { ascending: false });
    
    // Filtrar por fecha si se proporciona
    if (startDate && endDate) {
      query = query
        .gte('created_at', new Date(startDate).toISOString())
        .lt('created_at', new Date(endDate).toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Formatear los datos para el frontend
    const formattedData = data.map(order => ({
      id: order.id,
      created_at: order.created_at,
      customer_name: order.nombre,
      total: order.total,
      status: order.status || 'pendiente',
      items: order.items,
      phone: order.telefono,
      direccion: order.direccion
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
        items: items,
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
