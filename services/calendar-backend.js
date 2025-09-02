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
            let credentials;
            
            console.log('🔧 Inicializando Google Calendar Service...');
            console.log('📧 Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
            console.log('📅 Calendar ID:', this.calendarId);
            
            // Intentar usar variables de entorno primero (para producción)
            if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
                credentials = {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
                };
                console.log('✅ Usando credenciales de variables de entorno');
            } else {
                // Fallback a archivo local (para desarrollo)
                const keyFile = path.resolve(this.serviceAccountKeyPath);
                if (fs.existsSync(keyFile)) {
                    credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
                    console.log('✅ Usando credenciales de archivo local');
                } else {
                    throw new Error('No se encontraron credenciales de Google Calendar');
                }
            }

            // Configurar autenticación JWT
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/calendar']
            );

            // Inicializar cliente de Calendar API
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            
            // Probar la conexión
            try {
                const calendarInfo = await this.calendar.calendars.get({
                    calendarId: this.calendarId
                });
                console.log('✅ Calendario encontrado:', calendarInfo.data.summary);
            } catch (calendarError) {
                console.error('❌ Error accediendo al calendario:', calendarError.message);
                throw new Error(`No se puede acceder al calendario: ${calendarError.message}`);
            }
            
            console.log('✅ Google Calendar Service inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Google Calendar Service:', error);
            throw error;
        }
    }

    async createEvent(reservation) {
        try {
            console.log('🔄 Iniciando creación de evento para reserva:', reservation.id);
            
            if (!this.calendar) {
                console.log('📅 Inicializando servicio de calendario...');
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
            
            console.log('📅 Procesando fecha/hora:', { dateStr, timeStr });
            
            // Usar zona horaria de España/Madrid para consistencia
            const timeZone = process.env.TIMEZONE || 'Europe/Madrid';
            
            // Crear fecha/hora directamente en la zona horaria especificada
            const startDateTime = `${dateStr}T${timeStr}`;
            const endTime = new Date(`${dateStr}T${timeStr}`);
            endTime.setHours(endTime.getHours() + 1);
            const endDateTime = endTime.toISOString().split('T')[0] + 'T' + endTime.toTimeString().split(' ')[0];
            
            console.log('📅 Evento creado:', { startDateTime, endDateTime, timeZone });
            
            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table_number} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
                start: {
                    dateTime: startDateTime,
                    timeZone: timeZone
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: timeZone
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 30 }
                    ]
                }
            };

            console.log('📝 Creando evento con datos:', {
                summary: event.summary,
                startTime: event.start.dateTime,
                calendarId: this.calendarId
            });

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log('✅ Evento de calendario creado exitosamente:', response.data.id);
            return response.data;
        } catch (calendarError) {
            console.error('❌ Error detallado creando evento de calendario:');
            console.error('Error message:', calendarError.message);
            console.error('Error code:', calendarError.code);
            console.error('Error details:', calendarError.errors);
            console.error('Calendar service config:', {
                hasCalendarId: !!this.calendarId,
                hasServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
                calendarId: this.calendarId,
                calendarInitialized: !!this.calendar
            });
            throw calendarError; // Re-throw para que se maneje en el nivel superior
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

            // Usar la misma lógica de parsing que en createEvent para consistencia
            const dateStr = reservation.date instanceof Date ? 
                reservation.date.toISOString().split('T')[0] : 
                reservation.date;
            const timeStr = reservation.time instanceof Date ?
                reservation.time.toTimeString().split(' ')[0] :
                reservation.time;
            
            // Usar zona horaria de España/Madrid para consistencia
            const timeZone = process.env.TIMEZONE || 'Europe/Madrid';
            
            // Crear fecha/hora directamente en la zona horaria especificada
            const startDateTime = `${dateStr}T${timeStr}`;
            const endTime = new Date(`${dateStr}T${timeStr}`);
            endTime.setHours(endTime.getHours() + 1);
            const endDateTime = endTime.toISOString().split('T')[0] + 'T' + endTime.toTimeString().split(' ')[0];
            
            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table_number} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
                start: {
                    dateTime: startDateTime,
                    timeZone: timeZone
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: timeZone
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
