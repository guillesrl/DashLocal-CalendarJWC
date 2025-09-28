const express = require('express');
const { google } = require('googleapis');
const GoogleCalendarBackendService = require('../services/calendar-backend');
const router = express.Router();

const calendarService = new GoogleCalendarBackendService();

// GET /api/reservations - Obtener todas las reservas (ahora obtiene eventos del calendario)
router.get('/', async (req, res) => {
    try {
        if (!calendarService.calendar) {
            await calendarService.initialize();
        }

        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30); // Obtener eventos para los próximos 30 días

        const response = await calendarService.calendar.events.list({
            calendarId: calendarService.calendarId,
            timeMin: timeMin,
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || '',
            location: event.location || '',
            status: event.status,
            htmlLink: event.htmlLink
        }));

        res.json(events);
    } catch (error) {
        console.error('Error obteniendo eventos del calendario:', error);
        res.status(500).json({ error: 'Error al obtener eventos del calendario', details: error.message });
    }
});

// POST /api/reservations - Crear nueva reserva (ahora crea un evento en el calendario)
router.post('/', async (req, res) => {
    try {
        const { customer_name, phone, date, time, people, table_number, observations } = req.body;
        
        if (!customer_name || !date || !time || !people) {
            return res.status(400).json({ error: 'Nombre, fecha, hora y número de personas son requeridos' });
        }

        // Crear objeto de reserva para el calendario
        const reservationData = { 
            customer_name, 
            phone: phone || '', 
            date, 
            time, 
            people, 
            table_number: table_number || '',
            observations: observations || ''
        };

        // Crear evento en Google Calendar
        const calendarEvent = await calendarService.createEvent(reservationData);
        
        // Devolver el evento creado
        const eventResponse = {
            id: calendarEvent.id,
            title: calendarEvent.summary,
            start: calendarEvent.start.dateTime || calendarEvent.start.date,
            end: calendarEvent.end.dateTime || calendarEvent.end.date,
            description: calendarEvent.description,
            htmlLink: calendarEvent.htmlLink,
            ...reservationData
        };

        res.status(201).json(eventResponse);
        
    } catch (error) {
        console.error('Error creando reserva:', error);
        res.status(500).json({ 
            error: 'Error al crear la reserva en el calendario', 
            details: error.message 
        });
    }
});

// PUT /api/reservations/:id - Actualizar reserva (ahora actualiza un evento en el calendario)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, phone, date, time, people, table_number, status, observations } = req.body;

        // Primero obtenemos el evento actual para verificar que existe
        let event;
        try {
            const response = await calendarService.calendar.events.get({
                calendarId: calendarService.calendarId,
                eventId: id
            });
            event = response.data;
        } catch (error) {
            if (error.code === 404) {
                return res.status(404).json({ error: 'Evento no encontrado en el calendario' });
            }
            throw error;
        }

        // Preparar datos actualizados
        const updatedEvent = {
            ...event,
            summary: customer_name ? `${customer_name} (${people || 1} pax)${table_number ? ` Mesa ${table_number}` : ''}` : event.summary,
            description: `Teléfono: ${phone || 'No especificado'}\n${observations ? `Observaciones: ${observations}` : ''}`,
            start: {
                dateTime: date && time ? new Date(`${date}T${time}`).toISOString() : event.start.dateTime,
                timeZone: event.start.timeZone
            },
            end: {
                dateTime: date && time ? new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000).toISOString() : event.end.dateTime,
                timeZone: event.end.timeZone
            }
        };

        // Actualizar el evento en Google Calendar
        const updatedEventResponse = await calendarService.calendar.events.update({
            calendarId: calendarService.calendarId,
            eventId: id,
            resource: updatedEvent
        });

        res.json({
            id: updatedEventResponse.data.id,
            title: updatedEventResponse.data.summary,
            start: updatedEventResponse.data.start.dateTime || updatedEventResponse.data.start.date,
            end: updatedEventResponse.data.end.dateTime || updatedEventResponse.data.end.date,
            description: updatedEventResponse.data.description,
            htmlLink: updatedEventResponse.data.htmlLink,
            customer_name,
            phone,
            date,
            time,
            people,
            table_number,
            observations
        });
        
    } catch (error) {
        console.error('Error actualizando reserva:', error);
        res.status(500).json({ 
            error: 'Error al actualizar la reserva en el calendario',
            details: error.message
        });
    }
});

// DELETE /api/reservations/:id - Eliminar reserva (ahora elimina un evento del calendario)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el evento existe
        try {
            await calendarService.calendar.events.get({
                calendarId: calendarService.calendarId,
                eventId: id
            });
        } catch (error) {
            if (error.code === 404) {
                return res.status(404).json({ error: 'Evento no encontrado en el calendario' });
            }
            throw error;
        }

        // Eliminar el evento de Google Calendar
        await calendarService.calendar.events.delete({
            calendarId: calendarService.calendarId,
            eventId: id
        });

        res.json({ message: 'Reserva eliminada correctamente del calendario' });
        
    } catch (error) {
        console.error('Error eliminando reserva:', error);
        res.status(500).json({ 
            error: 'Error al eliminar la reserva del calendario',
            details: error.message
        });
    }
});

// Este endpoint ya no es necesario ya que el endpoint raíz (/) ahora devuelve los eventos del calendario
// Se mantiene por compatibilidad con el frontend existente
router.get('/calendar-events', async (req, res) => {
    try {
        if (!calendarService.calendar) {
            await calendarService.initialize();
        }

        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30); // Obtener eventos para los próximos 30 días

        const response = await calendarService.calendar.events.list({
            calendarId: calendarService.calendarId,
            timeMin: timeMin,
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items.map(event => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            description: event.description || '',
            location: event.location || '',
            status: event.status,
            htmlLink: event.htmlLink
        }));

        res.json(events);
    } catch (error) {
        console.error('Error al obtener eventos del calendario:', error);
        res.status(500).json({ error: 'Error al obtener eventos del calendario', details: error.message });
    }
});

module.exports = router;
