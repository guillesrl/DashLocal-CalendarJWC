const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// GET /api/orders - Obtener todas las órdenes
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/orders - Crear nueva orden
router.post('/', async (req, res) => {
    try {
        const { table_number, items, total } = req.body;
        
        if (!table_number || !items || !total) {
            return res.status(400).json({ error: 'Mesa, items y total son requeridos' });
        }

        const result = await pool.query(
            'INSERT INTO orders (table_number, items, total) VALUES ($1, $2, $3) RETURNING *',
            [table_number, JSON.stringify(items), total]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando orden:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/orders/:id - Actualizar orden
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { table_number, items, total, status } = req.body;

        const result = await pool.query(
            'UPDATE orders SET table_number = $1, items = $2, total = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [table_number, JSON.stringify(items), total, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error actualizando orden:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/orders/:id - Eliminar orden
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        res.json({ message: 'Orden eliminada correctamente' });
    } catch (error) {
        console.error('Error eliminando orden:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
