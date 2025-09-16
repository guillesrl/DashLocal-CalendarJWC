const express = require('express');
const { supabase } = require('../config/database');
const router = express.Router();

// GET /api/menu - Obtener todos los elementos del menú
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
        .from('menu')
        .select('*')
        .filter('Precio', 'not.is', null)
        .order('id');
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/menu - Crear nuevo elemento del menú
router.post('/', async (req, res) => {
    try {
        const { Nombre, Precio, Categoría, Ingredientes } = req.body;
        
        if (!Nombre || !Precio) {
            return res.status(400).json({ error: 'Nombre y precio son requeridos' });
        }

        const { data, error } = await supabase
            .from('menu')
            .insert([{ Nombre, Precio, Categoría, Ingredientes }])
            .select()
            .single();
        
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/menu/:id - Actualizar elemento del menú
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre, Precio, Categoría, Ingredientes } = req.body;

        const { data, error } = await supabase
            .from('menu')
            .update({ Nombre, Precio, Categoría, Ingredientes })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Elemento del menú no encontrado' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error actualizando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/menu/:id - Eliminar elemento del menú
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('menu')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Elemento del menú no encontrado' });
            }
            throw error;
        }

        res.json({ message: 'Elemento del menú eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
