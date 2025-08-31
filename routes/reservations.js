const express = require('express');
const { pool } = require('../config/database');
const GoogleCalendarBackendService = require('../services/calendar-backend');
const router = express.Router();

const calendarService = new GoogleCalendarBackendService();

// GET /api/reservations - Obtener todas las reservas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reservations ORDER BY date, time');
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/reservations - Crear nueva reserva
router.post('/', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { customer_name, phone, date, time, people, table_number } = req.body;
        
        if (!customer_name || !date || !time || !people) {
            return res.status(400).json({ error: 'Nombre, fecha, hora y número de personas son requeridos' });
        }

        // Insertar reserva en la base de datos
        const result = await client.query(
            'INSERT INTO reservations (customer_name, phone, date, time, people, table_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_name, phone, date, time, people, table_number]
        );

        const reservation = result.rows[0];

        // Crear evento en Google Calendar
        try {
            const calendarEvent = await calendarService.createEvent(reservation);
            
            // Actualizar reserva con el ID del evento de Google Calendar
            await client.query(
                'UPDATE reservations SET google_event_id = $1 WHERE id = $2',
                [calendarEvent.id, reservation.id]
            );
            
            reservation.google_event_id = calendarEvent.id;
        } catch (calendarError) {
            console.error('Error creando evento de calendario:', calendarError);
            // Continuar sin el evento de calendario
        }

        await client.query('COMMIT');
        res.status(201).json(reservation);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// PUT /api/reservations/:id - Actualizar reserva
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { customer_name, phone, date, time, people, table_number, status } = req.body;

        // Obtener reserva actual
        const currentReservation = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
        
        if (currentReservation.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Actualizar reserva en la base de datos
        const result = await client.query(
            'UPDATE reservations SET customer_name = $1, phone = $2, date = $3, time = $4, people = $5, table_number = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
            [customer_name, phone, date, time, people, table_number, status, id]
        );

        const updatedReservation = result.rows[0];

        // Actualizar evento en Google Calendar si existe
        if (updatedReservation.google_event_id) {
            try {
                await calendarService.updateEvent(updatedReservation.google_event_id, updatedReservation);
            } catch (calendarError) {
                console.error('Error actualizando evento de calendario:', calendarError);
            }
        }

        await client.query('COMMIT');
        res.json(updatedReservation);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// DELETE /api/reservations/:id - Eliminar reserva
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;

        // Obtener reserva para obtener el ID del evento de Google Calendar
        const reservation = await client.query('SELECT * FROM reservations WHERE id = $1', [id]);
        
        if (reservation.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Eliminar evento de Google Calendar si existe
        if (reservation.rows[0].google_event_id) {
            try {
                await calendarService.deleteEvent(reservation.rows[0].google_event_id);
            } catch (calendarError) {
                console.error('Error eliminando evento de calendario:', calendarError);
            }
        }

        // Eliminar reserva de la base de datos
        await client.query('DELETE FROM reservations WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Reserva eliminada correctamente' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error eliminando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

module.exports = router;
