const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET /api/menu - Obtener todos los elementos del menú
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/menu - Crear nuevo elemento del menú
router.post('/', async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Nombre y precio son requeridos' });
        }

        const result = await pool.query(
            'INSERT INTO menu_items (name, price, category, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, price, category, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/menu/:id - Actualizar elemento del menú
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, description } = req.body;

        const result = await pool.query(
            'UPDATE menu_items SET name = $1, price = $2, category = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [name, price, category, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Elemento del menú no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error actualizando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/menu/:id - Eliminar elemento del menú
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Elemento del menú no encontrado' });
        }

        res.json({ message: 'Elemento del menú eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando elemento del menú:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
