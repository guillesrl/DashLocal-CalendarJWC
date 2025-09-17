const express = require('express');
const { supabase } = require('../config/database');
const router = express.Router();

// GET /api/orders - Obtener todas las órdenes
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
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

module.exports = router;
