require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const { supabase } = require('../config/database');

const router = express.Router();

// Función para inicializar la autenticación de Google
const initializeGoogleAuth = () => {
  try {
    // Verificar si tenemos las variables de entorno necesarias
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.error('❌ Missing required Google service account environment variables');
      return null;
    }

    console.log('🔑 Initializing Google Auth with service account email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || 'your-project-id',
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || 'your-private-key-id',
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID || 'your-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    console.log('✅ Google Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('❌ Error initializing Google Auth:', error.message);
    console.error(error.stack);
    return null;
  }
};

// Inicializar autenticación al cargar el módulo
const auth = initializeGoogleAuth();

// Middleware para verificar la autenticación
const requireAuth = (req, res, next) => {
  if (!auth) {
    console.error('❌ Google Auth not initialized');
    return res.status(500).json({ 
      error: 'Error de configuración del servidor',
      details: 'No se pudo inicializar la autenticación de Google'
    });
  }
  next();
};

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
