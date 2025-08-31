const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleCalendarBackendService {
    constructor() {
        this.calendarId = process.env.GOOGLE_CALENDAR_ID;
        this.serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';
        this.calendar = null;
        this.auth = null;
    }

    async initialize() {
        try {
            // Leer las credenciales del service account
            const keyFile = path.resolve(this.serviceAccountKeyPath);
            const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

            // Configurar autenticación JWT
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/calendar']
            );

            // Inicializar cliente de Calendar API
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            
            console.log('✅ Google Calendar Service inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Google Calendar Service:', error);
            throw error;
        }
    }

    async createEvent(reservation) {
        try {
            if (!this.calendar) {
                await this.initialize();
            }

            // Calcular tiempo de fin (1 hora después del inicio)
            // Asegurar formato correcto de fecha y hora
            const dateStr = reservation.date instanceof Date ? 
                reservation.date.toISOString().split('T')[0] : 
                reservation.date;
            const timeStr = reservation.time instanceof Date ?
                reservation.time.toTimeString().split(' ')[0] :
                reservation.time;
            
            const startTime = new Date(`${dateStr}T${timeStr}`);
            
            // Verificar que la fecha es válida
            if (isNaN(startTime.getTime())) {
                throw new Error(`Fecha/hora inválida: ${dateStr}T${timeStr}`);
            }
            
            const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);

            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table_number} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ]
                }
            };

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log('✅ Evento de calendario creado:', response.data.id);
            return response.data;
        } catch (error) {
            console.error('❌ Error creando evento de calendario:', error);
            throw error;
        }
    }

    async deleteEvent(eventId) {
        try {
            if (!this.calendar) {
                await this.initialize();
            }

            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId
            });

            console.log('✅ Evento de calendario eliminado:', eventId);
            return true;
        } catch (error) {
            console.error('❌ Error eliminando evento de calendario:', error);
            throw error;
        }
    }

    async updateEvent(eventId, reservation) {
        try {
            if (!this.calendar) {
                await this.initialize();
            }

            const startTime = new Date(`${reservation.date}T${reservation.time}:00`);
            const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);

            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table_number} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const response = await this.calendar.events.update({
                calendarId: this.calendarId,
                eventId: eventId,
                resource: event
            });

            console.log('✅ Evento de calendario actualizado:', eventId);
            return response.data;
        } catch (error) {
            console.error('❌ Error actualizando evento de calendario:', error);
            throw error;
        }
    }
}

module.exports = GoogleCalendarBackendService;
