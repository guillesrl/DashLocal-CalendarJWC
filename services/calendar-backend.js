const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { JWT } = require('google-auth-library');

class GoogleCalendarBackendService {
    constructor() {
        this.calendarId = process.env.GOOGLE_CALENDAR_ID;
        this.calendar = null;
        this.jwtClient = null;
        
        // Verificar variables de entorno requeridas
        this.requiredEnvVars = [
            'GOOGLE_CALENDAR_ID',
            'GOOGLE_SERVICE_ACCOUNT_EMAIL',
            'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
        ];
        
        this.missingEnvVars = this.requiredEnvVars.filter(
            envVar => !process.env[envVar]
        );
        
        if (this.missingEnvVars.length > 0) {
            console.error('❌ Faltan variables de entorno requeridas:', this.missingEnvVars);
        }
    }

    async initialize() {
        try {
            if (this.missingEnvVars.length > 0) {
                throw new Error(`Faltan variables de entorno requeridas: ${this.missingEnvVars.join(', ')}`);
            }
            
            console.log('🔧 Inicializando Google Calendar Service...');
            console.log('📅 Calendar ID:', this.calendarId);
            
            // Crear objeto de credenciales desde variables de entorno
            const credentials = {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
            };
            
            console.log('✅ Credenciales configuradas desde variables de entorno');
            
            // Configurar autenticación JWT
            console.log('🔑 Configurando autenticación JWT...');
            console.log('📧 Email de la cuenta de servicio:', credentials.client_email);
            
            // Crear cliente JWT
            this.jwtClient = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/calendar'],
                subject: credentials.client_email // Para la delegación de dominio (si es necesario)
            });
            
            // Autenticar
            console.log('🔐 Autenticando con Google...');
            await this.jwtClient.authorize();
            
            // Inicializar cliente de Calendar API
            console.log('🚀 Inicializando cliente de Calendar API...');
            this.calendar = google.calendar({ version: 'v3', auth: this.jwtClient });
            
            // Probar la conexión
            try {
                console.log('🔍 Probando conexión con el calendario...');
                const calendarInfo = await this.calendar.calendars.get({
                    calendarId: this.calendarId
                });
                console.log('✅ Calendario encontrado:', calendarInfo.data.summary);
                console.log('✅ Zona horaria del calendario:', calendarInfo.data.timeZone);
            } catch (calendarError) {
                console.error('❌ Error accediendo al calendario:', calendarError.message);
                if (calendarError.response) {
                    console.error('Detalles del error:', calendarError.response.data);
                }
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
            if (!this.calendar) {
                await this.initialize();
            }
            
            // Asegurarse de que el cliente JWT esté autenticado
            if (this.jwtClient.credentials) {
                console.log('🔑 Token de acceso válido hasta:', new Date(this.jwtClient.credentials.expiry_date));
            } else {
                console.log('🔐 Renovando token de acceso...');
                await this.jwtClient.authorize();
            }
            
            // Renovar token si es necesario
            if (this.jwtClient.credentials.expiry_date < Date.now()) {
                console.log('🔄 Renovando token de acceso...');
                await this.jwtClient.authorize();
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
                summary: `${reservation.customer_name} (${reservation.people} pax) Mesa ${reservation.table_number}`,
                description: `Teléfono: ${reservation.phone || 'No especificado'}\n${reservation.observations ? `Observaciones: ${reservation.observations}` : ''}`,
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
            
            // Renovar token si es necesario
            if (this.jwtClient.credentials.expiry_date < Date.now()) {
                console.log('🔄 Renovando token de acceso...');
                await this.jwtClient.authorize();
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

            // Renovar token si es necesario
            if (this.jwtClient.credentials.expiry_date < Date.now()) {
                console.log('🔄 Renovando token de acceso...');
                await this.jwtClient.authorize();
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
                summary: `${reservation.customer_name} (${reservation.people} pax) Mesa ${reservation.table_number}`,
                description: `Teléfono: ${reservation.phone || 'No especificado'}\n${reservation.observations ? `Observaciones: ${reservation.observations}` : ''}`,
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
