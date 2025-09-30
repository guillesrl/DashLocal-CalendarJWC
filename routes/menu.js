const express = require('express');
const { supabase } = require('../config/database');
const router = express.Router();

if (!supabase) {
    console.error('Supabase client is not initialized');
    router.use((req, res, next) => {
        res.status(503).json({ error: 'Database connection is not configured' });
    });
    module.exports = router;
} else {

// GET /api/menu - Obtener todos los elementos del menú
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('menu')
            .select('id, nombre, precio, categoria, ingredientes, stock')
            .order('id', { ascending: true });
        if (error) {
            console.error('Error getting menu items:', error);
            throw error;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un item específico del menú
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('menu')
            .select('id, nombre, precio, categoria, ingredientes, stock')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo item en el menú
router.post('/', async (req, res) => {
    const { nombre, precio, categoria, ingredientes, stock } = req.body;
    try {
        const { data, error } = await supabase
            .from('menu')
            .insert([{ nombre, precio, categoria, ingredientes, stock }])
            .select();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar un item del menú
router.put('/:id', async (req, res) => {
    const { nombre, precio, categoria, ingredientes, stock } = req.body;
    try {
        const { data, error } = await supabase
            .from('menu')
            .update({ nombre, precio, categoria, ingredientes, stock })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('menu')
            .update(req.body)
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
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
}
