const express = require('express');
const { supabase } = require('../config/database');
const GoogleCalendarBackendService = require('../services/calendar-backend');
const router = express.Router();

const calendarService = new GoogleCalendarBackendService();

// GET /api/reservations - Obtener todas las reservas
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .order('date')
            .order('time');
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/reservations - Crear nueva reserva
router.post('/', async (req, res) => {
    try {
        const { customer_name, phone, date, time, people, table_number, observations } = req.body;
        
        if (!customer_name || !date || !time || !people) {
            return res.status(400).json({ error: 'Nombre, fecha, hora y número de personas son requeridos' });
        }

        // Insertar reserva en la base de datos
        const { data: reservation, error } = await supabase
            .from('reservations')
            .insert([{ customer_name, phone, date, time, people, table_number, observations }])
            .select()
            .single();
        
        if (error) throw error;

        // Crear evento en Google Calendar
        try {
            const calendarEvent = await calendarService.createEvent(reservation);
            
            // Actualizar reserva con el ID del evento de Google Calendar
            const { error: updateError } = await supabase
                .from('reservations')
                .update({ google_event_id: calendarEvent.id })
                .eq('id', reservation.id);
            
            if (!updateError) {
                reservation.google_event_id = calendarEvent.id;
            }
        } catch (calendarError) {
            console.error('Error creando evento de calendario:', calendarError);
            // Continuar sin el evento de calendario
        }

        res.status(201).json(reservation);
        
    } catch (error) {
        console.error('Error creando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/reservations/:id - Actualizar reserva
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, phone, date, time, people, table_number, status, observations } = req.body;

        // Obtener reserva actual
        const { data: currentReservation, error: fetchError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError || !currentReservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Actualizar reserva en la base de datos
        const { data: updatedReservation, error } = await supabase
            .from('reservations')
            .update({ 
                customer_name, 
                phone, 
                date, 
                time, 
                people, 
                table_number, 
                status, 
                observations,
                updated_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Actualizar evento en Google Calendar si existe
        if (updatedReservation.google_event_id) {
            try {
                await calendarService.updateEvent(updatedReservation.google_event_id, updatedReservation);
            } catch (calendarError) {
                console.error('Error actualizando evento de calendario:', calendarError);
            }
        }

        res.json(updatedReservation);
        
    } catch (error) {
        console.error('Error actualizando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/reservations/:id - Eliminar reserva
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener reserva para obtener el ID del evento de Google Calendar
        const { data: reservation, error: fetchError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError || !reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Eliminar evento de Google Calendar si existe
        if (reservation.google_event_id) {
            try {
                await calendarService.deleteEvent(reservation.google_event_id);
            } catch (calendarError) {
                console.error('Error eliminando evento de calendario:', calendarError);
            }
        }

        // Eliminar reserva de la base de datos
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Reserva eliminada correctamente' });
        
    } catch (error) {
        console.error('Error eliminando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
