// Google Calendar Service Account implementation
class GoogleCalendarService {
    constructor(serviceAccountKey, calendarId = 'primary') {
        this.serviceAccountKey = serviceAccountKey;
        this.calendarId = calendarId;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Generate JWT for Service Account authentication
    async generateJWT() {
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: this.serviceAccountKey.client_email,
            scope: 'https://www.googleapis.com/auth/calendar',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600, // 1 hour
            iat: now
        };

        // Base64url encode header and payload
        const encodedHeader = this.base64urlEncode(JSON.stringify(header));
        const encodedPayload = this.base64urlEncode(JSON.stringify(payload));
        
        // Create signature
        const signatureInput = `${encodedHeader}.${encodedPayload}`;
        const signature = await this.signWithPrivateKey(signatureInput, this.serviceAccountKey.private_key);
        
        return `${signatureInput}.${signature}`;
    }

    // Base64url encoding
    base64urlEncode(str) {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Sign with private key (simplified - in production use crypto library)
    async signWithPrivateKey(data, privateKey) {
        // This is a simplified implementation
        // In a real application, you would use the Web Crypto API or a crypto library
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Import the private key
        const keyData = this.pemToArrayBuffer(privateKey);
        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            keyData,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256'
            },
            false,
            ['sign']
        );

        // Sign the data
        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            cryptoKey,
            dataBuffer
        );

        // Convert to base64url
        const signatureArray = new Uint8Array(signature);
        const signatureString = String.fromCharCode.apply(null, signatureArray);
        return this.base64urlEncode(signatureString);
    }

    // Convert PEM to ArrayBuffer
    pemToArrayBuffer(pem) {
        const pemHeader = '-----BEGIN PRIVATE KEY-----';
        const pemFooter = '-----END PRIVATE KEY-----';
        const pemContents = pem.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');
        const binaryString = atob(pemContents);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Get access token
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const jwt = await this.generateJWT();
            
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt
                })
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.statusText}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('Error getting access token:', error);
            throw error;
        }
    }

    // Create calendar event
    async createEvent(reservation) {
        try {
            const accessToken = await this.getAccessToken();
            
            // Calculate end time (1 hour after start)
            const startTime = new Date(`${reservation.date}T${reservation.time}:00`);
            const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);

            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
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
                        { method: 'email', minutes: 24 * 60 }, // 1 day before
                        { method: 'popup', minutes: 30 } // 30 minutes before
                    ]
                }
            };

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error(`Failed to create event: ${response.statusText}`);
            }

            const createdEvent = await response.json();
            console.log('Event created successfully:', createdEvent);
            console.log('Event details:', {
                id: createdEvent.id,
                summary: createdEvent.summary,
                start: createdEvent.start,
                calendarId: this.calendarId,
                htmlLink: createdEvent.htmlLink
            });
            return createdEvent;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    // Delete calendar event
    async deleteEvent(eventId) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok && response.status !== 404) {
                throw new Error(`Failed to delete event: ${response.statusText}`);
            }

            console.log('Event deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            throw error;
        }
    }

    // List calendars to find the correct calendar ID
    async listCalendars() {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to list calendars: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Available calendars:', data.items);
            return data.items;
        } catch (error) {
            console.error('Error listing calendars:', error);
            throw error;
        }
    }

    // Update calendar event
    async updateEvent(eventId, reservation) {
        try {
            const accessToken = await this.getAccessToken();
            
            // Calculate end time (1 hour after start)
            const startTime = new Date(`${reservation.date}T${reservation.time}:00`);
            const endTime = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);

            const event = {
                summary: `Reserva - ${reservation.customer_name}`,
                description: `Mesa ${reservation.table} para ${reservation.people} personas.\nTeléfono: ${reservation.phone}\nID Reserva: ${reservation.id}`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error(`Failed to update event: ${response.statusText}`);
            }

            const updatedEvent = await response.json();
            console.log('Event updated successfully:', updatedEvent);
            return updatedEvent;
        } catch (error) {
            console.error('Error updating calendar event:', error);
            throw error;
        }
    }
}
