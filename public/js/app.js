// API configuration
const config = {
    apiBaseUrl: '/api',
    googleCalendar: {
        calendarId: "2385d6833d1b3a264fea105c8e3b81c996a274bafe7f42ee742b92cccc783801@group.calendar.google.com"
    }
};

// Data storage
let menuItems = [];
let orders = [];
let reservations = [];
let calendarEvents = [];

// API Helper functions
async function apiRequest(endpoint, options = {}) {
    console.log(`Haciendo petición a: ${config.apiBaseUrl}${endpoint}`);
    try {
        const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            cache: 'no-cache',
            ...options
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            console.error('Error en la respuesta de la API:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                responseData: data
            });
            
            const errorMessage = data.error || data.message || response.statusText;
            throw new Error(`Error en la API (${response.status}): ${errorMessage}`);
        }
        
        console.log(`Respuesta de ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error('Error en la petición a la API:', {
            endpoint,
            error: error.message,
            stack: error.stack
        });
        
        showNotification(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Navigation functions
function showSection(sectionId) {
    console.log(`Mostrando sección: ${sectionId}`);

    // Validar que la sección existe
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error(`No se encontró la sección con ID: ${sectionId}`);
        return false;
    }
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    
    try {
        // Mostrar la sección seleccionada
        section.classList.remove('hidden');
        section.classList.add('active');
        
        // Actualizar el enlace activo
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('bg-secondary');
        });
        
        const activeLink = document.querySelector(`nav a[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('bg-secondary');
        } else {
            console.warn(`No se encontró el enlace de navegación para la sección: ${sectionId}`);
        }
        
        // Cargar datos específicos de la sección
        switch(sectionId) {
            case 'dashboard':
                loadDashboardStats().catch(error => {
                    console.error('Error cargando el dashboard:', error);
                    showNotification('Error al cargar el dashboard', 'error');
                });
                break;
            case 'menu':
                loadMenuItems().catch(error => {
                    console.error('Error cargando el menú:', error);
                    showNotification('Error al cargar el menú', 'error');
                });
                break;
            case 'orders':
                loadOrders().catch(error => {
                    console.error('Error cargando los pedidos:', error);
                    showNotification('Error al cargar los pedidos', 'error');
                });
                break;
            case 'reservations':
                loadReservations().catch(error => {
                    console.error('Error cargando las reservas:', error);
                    showNotification('Error al cargar las reservas', 'error');
                });
                break;
            default:
                console.log(`No hay carga de datos específica para la sección: ${sectionId}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Error al mostrar la sección ${sectionId}:`, error);
        showNotification(`Error al cargar la sección: ${sectionId}`, 'error');
        return false;
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showAddMenuItemModal() {
    showModal('add-menu-item-modal');
}

function showAddReservationModal() {
    const modal = document.getElementById('add-reservation-modal');
    const form = document.getElementById('add-reservation-form');
    
    if (modal && form) {
        // Resetear el formulario
        form.reset();
        
        // Establecer la fecha y hora por defecto (ahora + 1 hora)
        const now = new Date();
        now.setHours(now.getHours() + 1);
        
        // Formatear fecha y hora para los inputs
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().substring(0, 5);
        
        // Establecer valores por defecto
        const dateInput = form.querySelector('input[type="date"]');
        const timeInput = form.querySelector('input[type="time"]');
        const peopleInput = form.querySelector('input[name="people"]');
        
        if (dateInput && timeInput && peopleInput) {
            dateInput.value = dateStr;
            timeInput.value = timeStr;
            peopleInput.value = '2';
            
            // Configurar el formulario para modo de adición
            form.dataset.editId = '';
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Agregar Reserva';
            }
            
            // Mostrar el modal
            showModal('add-reservation-modal');
        } else {
            console.error('No se encontraron todos los elementos del formulario de reserva');
        }
    }
}

function showAddOrderModal() {
    showModal('add-order-modal');
}

// Data loading functions
async function loadDashboardStats() {
    try {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // Fetch monthly orders
        const monthlyOrdersResponse = await apiRequest(`/orders?startDate=${startOfMonth.split('T')[0]}&endDate=${endOfMonth.split('T')[0]}`);
        const monthlyOrders = monthlyOrdersResponse.data || [];
        document.getElementById('month-orders').textContent = monthlyOrders.length;

        // Filter today's orders from the monthly list
        const todayOrders = monthlyOrders.filter(order => (order.created_at || order.date).startsWith(today));
        document.getElementById('today-orders').textContent = todayOrders.length;
        
        // Calculate revenues
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        document.getElementById('today-revenue').textContent = `$${todayRevenue.toFixed(2)}`;
        
        const monthRevenue = monthlyOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        document.getElementById('month-revenue').textContent = `$${monthRevenue.toFixed(2)}`;

        // Update recent orders table
        updateRecentOrdersTable(todayOrders.slice(0, 5));
        
        // Fetch monthly reservations
        const monthlyReservationsResponse = await apiRequest(`/reservations/calendar-events?timeMin=${encodeURIComponent(startOfMonth)}&timeMax=${encodeURIComponent(endOfMonth)}`);
        const monthlyReservations = Array.isArray(monthlyReservationsResponse) ? monthlyReservationsResponse : [];
        document.getElementById('month-reservations').textContent = monthlyReservations.length;

        // Filter today's reservations from the monthly list
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayReservations = monthlyReservations.filter(event => {
            const eventStartDate = new Date(event.start?.dateTime || event.start?.date);
            return eventStartDate >= startOfToday && eventStartDate <= endOfToday;
        });
        document.getElementById('today-reservations').textContent = todayReservations.length;
        
        // Update upcoming reservations table
        updateUpcomingReservationsTable(todayReservations);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Error al cargar las estadísticas del dashboard', 'error');
    }
}

function updateRecentOrdersTable(orders) {
    const tbody = document.querySelector('#recent-orders tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (orders.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="py-4 text-center text-gray-500">No hay pedidos hoy</td>`;
        tbody.appendChild(row);
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2">${order.id}</td>
            <td class="py-2">${order.direccion || 'N/A'}</td>
            <td class="py-2">$${parseFloat(order.total || 0).toFixed(2)}</td>
            <td class="py-2">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.estado)}">
                    ${order.estado || 'Pendiente'}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Función para procesar un evento individual
function parseEvent(event) {
    try {
        console.log('Procesando evento:', event);
        
        // Obtener título y descripción
        const title = event.summary || 'Reserva sin título';
        const description = event.description || '';
        
        // Manejo de fechas
        let startTime, dateString = 'Hora no disponible';
        
        if (event.start) {
            startTime = event.start.dateTime ? new Date(event.start.dateTime) : 
                      (event.start.date ? new Date(event.start.date) : null);
            
            if (startTime && !isNaN(startTime.getTime())) {
                dateString = startTime.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        }
        
        // Extraer información del título (formato: "Nombre (X pax)")
        const titleMatch = title.match(/(.*?)\s*\((\d+)\s*pax\)/i) || [];
        const customerName = (titleMatch[1] || title).trim();
        const people = titleMatch[2] ? parseInt(titleMatch[2], 10) : 1;
        
        // Extraer número de mesa de la descripción
        const tableMatch = description.match(/Mesa:\s*(\d+|S\/N)/i);
        const table = tableMatch ? tableMatch[1] : 'N/A';
        
        return {
            customerName,
            time: dateString,
            people,
            table,
            htmlLink: event.htmlLink || '#'
        };
        
    } catch (error) {
        console.error('Error al procesar el evento:', error, event);
        return {
            customerName: 'Error al cargar',
            time: '--:--',
            people: 0,
            table: 'N/A',
            htmlLink: '#'
        };
    }
}

function updateUpcomingReservationsTable(events) {
    const container = document.getElementById('upcoming-events');
    if (!container) {
        console.error('No se encontró el contenedor de eventos');
        return;
    }
    
    console.log('Eventos recibidos para mostrar:', events);
    
    // Mostrar mensaje si no hay eventos
    if (!Array.isArray(events) || events.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 py-4">No hay reservas para hoy</p>';
        return;
    }
    
    // Función para obtener el timestamp de un evento
    const getEventTime = (event) => {
        // Manejar diferentes formatos de fecha de inicio
        if (event.start?.dateTime) return new Date(event.start.dateTime).getTime();
        if (event.start?.date) return new Date(event.start.date).getTime();
        if (event.start) return new Date(event.start).getTime();
        return 0;
    };
    
    // Ordenar eventos por hora de inicio
    const sortedEvents = [...events].sort((a, b) => getEventTime(a) - getEventTime(b));
    
    // Procesar cada evento (máximo 5)
    const eventsHTML = sortedEvents.slice(0, 5).map(event => {
        try {
            console.log('Procesando evento:', event);
            
            // Extraer información básica
            const title = event.summary || event.title || 'Reserva';
            const description = event.description || '';
            
            // Obtener la hora de inicio en el formato correcto
            let timeStr = '--:--';
            const startTime = event.start?.dateTime || event.start?.date || event.start;
            
            if (startTime) {
                try {
                    const date = new Date(startTime);
                    if (!isNaN(date.getTime())) {
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        timeStr = `${hours}:${minutes}`;
                    }
                } catch (error) {
                    console.error('Error al formatear la hora:', error);
                }
            }
            
            // Extraer número de personas (de título o descripción)
            let people = '1';
            const peopleMatch = title.match(/\((\d+)\s*(?:pax|personas?)\)/i) || 
                              description.match(/(\d+)\s*(personas?|pax|comensales?)/i);
            if (peopleMatch) {
                people = peopleMatch[1];
            }

            // Extraer teléfono de la descripción si está disponible
            let phone = 'N/A';
            if (event.description) {
                const phoneMatch = event.description.match(/Tel[ée]fono:\s*([^\n]+)/i);
                if (phoneMatch) {
                    phone = phoneMatch[1].trim();
                } else {
                    phone = event.description.trim();
                }
            }
            
            // Extraer número de mesa (de descripción)
            let table = 'N/A';
            const tableMatch = description.match(/Mesa[\s:]*([^\s<]+)/i) || 
                             description.match(/Mesa\s*(\d+|S\/N)/i);
            if (tableMatch) {
                table = tableMatch[1].replace(/[^\d\/A-Z]+/gi, ''); // Limpiar el texto
            }
            
            // Limpiar el nombre del cliente
            let customerName = title
                .replace(/\((\d+)\s*pax\)/i, '') // Eliminar (X pax)
                .replace(/\((\d+)\s*personas?\)/i, '') // Eliminar (X personas)
                .replace(/\d+/g, '') // Eliminar números sueltos
                .replace(/\s+/g, ' ') // Eliminar espacios múltiples
                .trim();
                
            if (!customerName) customerName = 'Reserva sin nombre';
            
            // Crear HTML del evento
            return `
                <div class="border-b border-gray-200 dark:border-gray-700 py-3">
                    <div class="flex justify-between items-center">
                        <div class="min-w-0">
                            <h4 class="font-medium text-gray-900 dark:text-white truncate">${customerName}</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center">
                                <span class="flex items-center mr-3">
                                    <i class="far fa-clock mr-1"></i>${timeStr}
                                </span>
                                <span class="flex items-center mr-3">
                                    <i class="fas fa-phone mr-1"></i>${phone}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-utensils mr-1"></i>Mesa ${table}
                                </span>
                            </p>
                        </div>
                        ${event.htmlLink ? `
                        <a href="${event.htmlLink}" target="_blank" class="ml-2 text-blue-500 hover:text-blue-700 flex-shrink-0" title="Ver en Google Calendar">
                            <i class="fas fa-external-link-alt"></i>
                        </a>` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error procesando evento:', error, event);
            return '';
        }
    }).join('');
    
    container.innerHTML = eventsHTML || '<p class="text-gray-500 dark:text-gray-400 py-4">No se pudieron cargar las reservas</p>';
}

// Helper functions
function getStatusBadgeClass(status) {
    const statusToUse = status || 'pendiente';
    const statusClasses = {
        'completado': 'bg-green-100 text-green-800',
        'en_proceso': 'bg-yellow-100 text-yellow-800',
        'cancelado': 'bg-red-100 text-red-800',
        'pendiente': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return statusClasses[statusToUse] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

function showNotification(message, type = 'success') {
    // Implementation of notification system
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can implement a proper notification UI here
}

// Función para inicializar la navegación
function initializeNavigation() {
    console.log('Inicializando navegación...');
    
    // Configurar manejadores de eventos para los enlaces de navegación
    document.querySelectorAll('nav a[data-section]').forEach(link => {
        // Remover cualquier manejador de eventos existente para evitar duplicados
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // Agregar el manejador de eventos al nuevo elemento
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = newLink.getAttribute('data-section');
            console.log(`Navegando a la sección: ${sectionId}`);
            showSection(sectionId);
            
            // Cerrar el menú móvil si está abierto
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth < 768) { // Solo en móviles
                sidebar.classList.add('-translate-x-full');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.add('hidden');
                }
            }
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('Aplicación iniciada');
        
        // Inicializar navegación
        initializeNavigation();
        
        // Mostrar la sección de dashboard por defecto
        showSection('dashboard');
        
        // Configurar el botón de menú móvil
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.toggle('hidden');
                }
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
            });
        }
        
        // El código de inicialización del menú móvil ya está más arriba
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const darkModeToggleMobile = document.getElementById('dark-mode-toggle-mobile');
        const darkModeIcon = document.getElementById('dark-mode-icon');
        const darkModeIconMobile = document.getElementById('dark-mode-icon-mobile');
        
        function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            
            // Update icons
            if (darkModeIcon) {
                darkModeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
            if (darkModeIconMobile) {
                darkModeIconMobile.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            // Save preference to localStorage
            localStorage.setItem('darkMode', isDark);
        }
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', toggleDarkMode);
        }
        
        if (darkModeToggleMobile) {
            darkModeToggleMobile.addEventListener('click', toggleDarkMode);
        }
        
        // Check for saved user preference
        if (localStorage.getItem('darkMode') === 'true' || 
            (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            if (darkModeIcon) darkModeIcon.className = 'fas fa-sun';
            if (darkModeIconMobile) darkModeIconMobile.className = 'fas fa-sun';
        }
        
        // Form submissions
        const addOrderForm = document.getElementById('add-order-form');
        if (addOrderForm) {
            addOrderForm.addEventListener('submit', addOrder);
        }
        
        const addMenuItemForm = document.getElementById('add-menu-item-form');
        if (addMenuItemForm) {
            addMenuItemForm.addEventListener('submit', saveMenuItem);
        }
        
        const addReservationForm = document.getElementById('add-reservation-form');
        if (addReservationForm) {
            addReservationForm.addEventListener('submit', addReservation);
        }
    }, 100);
});

// Form handling functions
async function addOrder(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const orderData = {
        customer_name: formData.get('customer_name'),
        phone: formData.get('phone'),
        direccion: formData.get('direccion'),
        items: formData.get('items'),
        total: parseFloat(formData.get('total')),
        status: 'pendiente',
        created_at: new Date().toISOString()
    };
    
    try {
        const response = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        showNotification('Pedido agregado correctamente', 'success');
        hideModal('add-order-modal');
        form.reset();
        loadOrders();
        loadDashboardStats();
    } catch (error) {
        console.error('Error adding order:', error);
        showNotification('Error al agregar el pedido', 'error');
    }
}

async function saveMenuItem(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const menuItemData = {
        nombre: formData.get('name'),
        ingredientes: formData.get('description'),
        precio: parseFloat(formData.get('price')),
        categoria: formData.get('category'),
        stock: parseInt(formData.get('stock'))
    };

    const editId = form.dataset.editId;
    const method = editId ? 'PUT' : 'POST';
    const endpoint = editId ? `/menu/${editId}` : '/menu';

    try {
        const response = await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(menuItemData)
        });
        
        showNotification('Ítem del menú guardado correctamente', 'success');
        hideModal('add-menu-item-modal');
        form.reset();
        form.dataset.editId = ''; // Clear editId after saving
        loadMenuItems();
    } catch (error) {
        console.error('Error saving menu item:', error);
        showNotification('Error al guardar el ítem del menú', 'error');
    }
}

async function addReservation(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Validar que todos los campos requeridos estén completos
    const requiredFields = ['customer_name', 'phone', 'date', 'time', 'people'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
        if (!formData.get(field)) {
            missingFields.push(field);
        }
    });
    
    if (missingFields.length > 0) {
        showNotification(`Por favor complete los campos requeridos: ${missingFields.join(', ')}`, 'error');
        return;
    }
    
    // Crear objeto de datos para la reserva
    const reservationData = {
        summary: `${formData.get('customer_name')} (${formData.get('people')} pax) Mesa ${formData.get('table') || 'S/N'}`,
        description: `Teléfono: ${formData.get('phone')}\n` +
                    `Personas: ${formData.get('people')}\n` +
                    `Mesa: ${formData.get('table') || 'Sin asignar'}\n` +
                    `Observaciones: ${formData.get('observations') || 'Ninguna'}`,
        start: {
            dateTime: new Date(`${formData.get('date')}T${formData.get('time')}:00`).toISOString(),
            timeZone: 'Europe/Madrid'
        },
        end: {
            // Asumimos 2 horas de duración por defecto
            dateTime: new Date(new Date(`${formData.get('date')}T${formData.get('time')}:00`).getTime() + 2 * 60 * 60 * 1000).toISOString(),
            timeZone: 'Europe/Madrid'
        },
        attendees: [
            { email: formData.get('email'), displayName: formData.get('customer_name') }
        ].filter(attendee => attendee.email),
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: false,
        transparency: 'opaque', // 'opaque' para mostrar como ocupado
        visibility: 'private',
        status: 'confirmed'
    };
    
    try {
        // Mostrar indicador de carga
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Determinar si es una nueva reserva o una actualización
        const isUpdate = form.dataset.editId;
        const method = isUpdate ? 'PUT' : 'POST';
        const endpoint = isUpdate ? `/reservations/${form.dataset.editId}` : '/reservations';
        
        // Enviar la solicitud al servidor
        const response = await apiRequest(endpoint, {
            method,
            body: JSON.stringify(reservationData)
        });
        
        // Mostrar notificación de éxito
        showNotification(
            isUpdate ? 'Reserva actualizada correctamente' : 'Reserva creada correctamente', 
            'success'
        );
        
        // Cerrar el modal y limpiar el formulario
        hideModal('add-reservation-modal');
        form.reset();
        
        // Recargar los datos
        await Promise.all([
            loadReservations(),
            loadDashboardStats()
        ]);
        
    } catch (error) {
        console.error('Error al guardar la reserva:', error);
        
        // Mostrar mensaje de error detallado
        let errorMessage = 'Error al guardar la reserva';
        if (error.response) {
            try {
                const errorData = await error.response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                console.error('Error al analizar la respuesta de error:', e);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = isUpdate ? 'Actualizar Reserva' : 'Agregar Reserva';
        }
    }
}

// Data loading functions
async function loadMenuItems() {
    const menuTable = document.getElementById('menu-table'); // Get the table element
    if (!menuTable) {
        console.error('No se encontró la tabla del menú');
        return;
    }
    menuTable.innerHTML = ''; // Clear the table

    const thead = document.createElement('thead');
    thead.classList.add('bg-gray-50', 'dark:bg-gray-700');
    thead.innerHTML = `
        <tr>
            <th class="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
            <th class="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
            <th class="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
            <th class="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
            <th class="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
            <th class="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
        </tr>
    `;
    menuTable.appendChild(thead);

    const menuItemsContainer = document.createElement('tbody');
    menuItemsContainer.id = 'menu-items';
    menuItemsContainer.classList.add('bg-white', 'dark:bg-gray-800', 'divide-y', 'divide-gray-200', 'dark:divide-gray-700');
    menuTable.appendChild(menuItemsContainer);

    try {
        const response = await fetch('/api/menu');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('La respuesta del servidor no es un array');
        }
        
        menuItems = data;

        
        if (data.length === 0) {
            console.log('No hay elementos en el menú');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No hay elementos en el menú
                </td>
            `;
            menuItemsContainer.appendChild(row);
            return;
        }
        
        // Filtrar elementos con precio mayor a 0
        const filteredData = data.filter(item => {
            const precio = parseFloat(item.Precio || item.price || item.precio || 0);
            return precio > 0;
        });

        if (filteredData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No hay elementos en el menú con precio mayor a 0
                </td>`;
            menuItemsContainer.appendChild(row);
            return [];
        }

        filteredData.forEach(item => {
            const row = document.createElement('tr');
            
            // Usar cualquier campo que pueda contener el nombre
            const nombre = item.nombre || 'Sin nombre';
            const ingredientes = item.ingredientes || 'N/A';
            const precio = item.precio || 0;
            const categoria = item.categoria || 'N/A';
            const stock = item.stock || 0;
            
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm">${item.id}</td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm">${nombre}</td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                    <div class="relative group">
                        <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs">Ingredientes</button>
                        <div class="absolute z-10 hidden group-hover:block bg-white text-gray-700 border rounded-lg p-4 w-80 right-0">
                            <p class="text-sm whitespace-normal">${ingredientes}</p>
                        </div>
                    </div>
                </td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm">$${parseFloat(precio).toFixed(2)}</td>
                <td class="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm">${categoria}</td>
                <td class="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm">
                    <input type="number" value="${stock}" onchange="updateStock(${item.id}, this.value)" style="width: 60px;" class="px-2 py-1 border rounded dark:bg-gray-800 dark:text-white" />
                </td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editMenuItem(${item.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteMenuItem(${item.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            menuItemsContainer.appendChild(row);
        });

        return filteredData;
    } catch (error) {
        console.error('Error cargando elementos del menú:', error);
        
        if (menuItemsContainer) {
            menuItemsContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-red-500">
                        Error al cargar el menú: ${error.message}
                    </td>
                </tr>
            `;
        }
        
        showNotification('Error al cargar el menú: ' + error.message, 'error');
        throw error; // Re-lanzar para que el Promise.all lo detecte
    }
}

async function loadOrders() {
    try {
        console.log('Cargando pedidos...');
        const response = await apiRequest('/orders');
        orders = response.data || [];
        
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) {
            console.error('No se encontró el elemento con ID orders-list');
            return;
        }
        
        console.log('Pedidos cargados:', orders);
        ordersList.innerHTML = '';
        
        if (orders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" class="px-6 py-4 text-center text-gray-500">
                    No hay pedidos registrados
                </td>`;
            ordersList.appendChild(row);
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-3 md:px-6 py-4 whitespace-nowrap">${order.id}</td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap">${order.customer_name || 'Cliente'}</td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap">${order.phone || 'N/A'}</td>
                <td class="hidden md:table-cell px-6 py-4">${order.direccion || 'N/A'}</td>
                <td class="px-3 md:px-6 py-4">
                    <div class="max-w-xs truncate" title="${order.items}">
                        ${order.items || 'N/A'}
                    </div>
                </td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap">$${parseFloat(order.total || 0).toFixed(2)}</td>
                <td class="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}">
                        ${order.status || 'Pendiente'}
                    </span>
                </td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap">
                    ${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex space-x-2">
                        <select onchange="updateOrderStatus(${order.id}, this.value)" 
                                class="text-xs p-1 border rounded bg-white dark:bg-gray-800">
                            <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en_proceso" ${order.status === 'en_proceso' ? 'selected' : ''}>En proceso</option>
                            <option value="completado" ${order.status === 'completado' ? 'selected' : ''}>Completado</option>
                            <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                        <button onclick="cancelOrder(${order.id})" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;
            ordersList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error al cargar los pedidos', 'error');
    }
}

async function loadReservations() {
    const reservationsList = document.getElementById('reservation-items');
    if (!reservationsList) {
        console.error('No se encontró el contenedor de reservas');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        reservationsList.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center">Cargando reservas...</td></tr>';
        
        // Cargar eventos del calendario para los próximos 30 días
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Set to the beginning of the day
        const future = new Date(now);
        future.setHours(23, 59, 59, 999); // Set to the end of the day

        const events = await loadCalendarEvents(now.toISOString(), future.toISOString());
        
        // Limpiar la lista
        reservationsList.innerHTML = '';
        
        const summaryFoot = document.getElementById('reservation-summary');
        
        if (events.length === 0) {
            reservationsList.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                        No hay reservas para hoy
                    </td>
                </tr>`;
            if (summaryFoot) summaryFoot.innerHTML = ''; // Clear summary
            return;
        }
        
        // Sort events by date
        events.sort((a, b) => new Date(a.start?.dateTime || a.start?.date) - new Date(b.start?.dateTime || b.start?.date));

        let totalPeople = 0;

        // Mostrar los eventos en la tabla
        events.forEach(event => {
            try {
                // Extraer información del evento
                const eventDate = new Date(event.start?.dateTime || event.start?.date || event.start);
                const formattedDate = eventDate.toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    day: '2-digit', 
                    month: 'short',
                    year: 'numeric'
                });
                
                const formattedTime = eventDate.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                });
                
                // Extraer información del título y descripción
                const title = event.summary || event.title || 'Reserva';
                const description = event.description || '';
                
                // Extraer información de personas
                let customerName = title;
                let people = 1;
                
                // Buscar información de personas en el título o descripción
                const peopleMatch = title.match(/\(\s*(\d+)\s*(?:pax|personas?)\s*\)/i) || 
                                  description.match(/Personas:\s*(\d+)/i);
                
                if (peopleMatch) {
                    people = parseInt(peopleMatch[1], 10);
                    customerName = customerName.replace(peopleMatch[0], '').trim();
                }
                
                totalPeople += people;

                // Buscar número de mesa en la descripción
                let tableNumber = '';
                const tableMatch = description.match(/Mesa[\s:]*([^\s<]+)/i) || 
                                 description.match(/Mesa\s*(\d+|S\/N)/i);
                
                if (tableMatch) {
                    tableNumber = tableMatch[1].replace(/[^\d\/A-Z]+/gi, '');
                }
                
                // Limpiar el nombre del cliente (eliminando la información de personas y mesa)
                customerName = customerName.replace(/Mesa\s*(\d+|S\/N)/i, '').trim();
                if (!customerName) customerName = 'Reserva sin nombre';
                
                // Extraer teléfono de la descripción si está disponible
                let phone = 'N/A';
                if (event.description) {
                    const phoneMatch = event.description.match(/Tel[ée]fono:\s*([^\n]+)/i);
                    if (phoneMatch) {
                        phone = phoneMatch[1].trim();
                    } else {
                        phone = event.description.trim();
                    }
                }
                
                // Crear la fila de la tabla
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800';
                row.innerHTML = `
                    <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${event.id.substring(0, 8)}...
                    </td>
                    <td class="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div class="font-medium text-gray-900 dark:text-white">${customerName || 'Cliente'}</div>
                    </td>
                    <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${phone}
                    </td>
                    <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${formattedDate}
                    </td>
                    <td class="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${formattedTime}
                    </td>
                    <td class="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${people} ${people === 1 ? 'persona' : 'personas'}
                    </td>
                    <td class="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${tableNumber || 'No'}
                    </td>
                    <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="${event.htmlLink}" target="_blank" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3" title="Ver en Google Calendar">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                        <button onclick="cancelReservation('${event.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Cancelar reserva">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                `;
                
                reservationsList.appendChild(row);
            } catch (error) {
                console.error('Error procesando evento del calendario:', error, event);
            }
        });

        if (summaryFoot) {
            summaryFoot.innerHTML = `
                <tr class="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
                    <td colspan="5" class="px-3 md:px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Comensales</td>
                    <td class="px-3 md:px-6 py-3 text-xs font-bold text-gray-900 dark:text-white">${totalPeople}</td>
                    <td colspan="2"></td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Error loading reservations:', error);
        showNotification('Error al cargar las reservas: ' + (error.message || 'Error desconocido'), 'error');
        
        const reservationsList = document.getElementById('reservation-items');
        if (reservationsList) {
            reservationsList.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-red-500">
                        Error al cargar las reservas. Por favor, intente recargar la página.
                    </td>
                </tr>`;
        }
    }
}

// CRUD Operations
async function editMenuItem(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;
    
    const form = document.getElementById('add-menu-item-form');
    if (!form) return;
    
    // Populate form
    form.elements['name'].value = item.nombre || '';
    form.elements['description'].value = item.ingredientes || '';
    form.elements['price'].value = item.precio || '';
    form.elements['category'].value = item.categoria || 'entradas';
    form.elements['stock'].value = item.stock || 0;
    
    // Change form to update mode
    form.dataset.editId = id;
    form.querySelector('button[type="submit"]').textContent = 'Actualizar';
    
    // Show modal
    showAddMenuItemModal();
}

async function deleteMenuItem(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este ítem del menú?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/menu/${id}`, {
            method: 'DELETE'
        });
        
        showNotification('Ítem del menú eliminado correctamente', 'success');
        loadMenuItems();
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showNotification('Error al eliminar el ítem del menú', 'error');
    }
}

async function updateStock(id, stock) {
    try {
        const response = await apiRequest(`/menu/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ stock: parseInt(stock) })
        });
        
        showNotification('Stock actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error updating stock:', error);
        showNotification('Error al actualizar el stock', 'error');
    }
}

async function updateOrderStatus(id, status) {
    try {
        const response = await apiRequest(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        
        showNotification('Estado del pedido actualizado correctamente', 'success');
        await loadOrders();
        await loadDashboardStats();
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error al actualizar el estado del pedido', 'error');
    }
}

async function cancelOrder(id) {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelado' })
        });
        
        showNotification('Pedido cancelado correctamente', 'success');
        loadOrders();
        loadDashboardStats();
    } catch (error) {
        console.error('Error canceling order:', error);
        showNotification('Error al cancelar el pedido', 'error');
    }
}

async function editReservation(id) {
    try {
        console.log('Editando reserva con ID:', id);
        
        // Buscar el evento en los eventos del calendario
        const event = calendarEvents.find(e => e.id === id);
        if (!event) {
            console.error('No se encontró el evento con ID:', id);
            showNotification('No se pudo encontrar la reserva para editar', 'error');
            return;
        }
        
        console.log('Evento encontrado:', event);
        
        const form = document.getElementById('add-reservation-form');
        if (!form) {
            console.error('No se encontró el formulario de reserva');
            return;
        }
        
        // Extraer información del evento
        const startDate = new Date(event.start.dateTime || event.start.date);
        
        // Formatear fecha y hora para los inputs
        const formattedDate = startDate.toISOString().split('T')[0];
        const formattedTime = startDate.toTimeString().substring(0, 5);
        
        // Extraer información adicional del título y descripción
        const titleMatch = event.summary ? event.summary.match(/(.*?)\((\d+)\s*pax\)\s*Mesa\s*(\d+|S\/N)/i) : null;
        const descriptionLines = event.description ? event.description.split('\n') : [];
        
        const phoneLine = descriptionLines.find(line => line.startsWith('Teléfono:'));
        const peopleLine = descriptionLines.find(line => line.startsWith('Personas:'));
        const tableLine = descriptionLines.find(line => line.startsWith('Mesa:'));
        const observationsLine = descriptionLines.find(line => line.startsWith('Observaciones:'));
        
        const customerName = titleMatch ? titleMatch[1].trim() : 'Nuevo Cliente';
        const people = peopleLine ? parseInt(peopleLine.replace('Personas:', '').trim(), 10) : 2;
        const table = tableLine ? tableLine.replace('Mesa:', '').trim() : '';
        const phone = phoneLine ? phoneLine.replace('Teléfono:', '').trim() : '';
        const observations = observationsLine ? observationsLine.replace('Observaciones:', '').trim() : '';
        
        // Extraer correo electrónico de los asistentes si está disponible
        const attendee = event.attendees && event.attendees.length > 0 ? event.attendees[0] : null;
        const email = attendee ? attendee.email : '';
        
        // Rellenar el formulario con los datos del evento
        form.reset();
        
        form.elements['customer_name'].value = customerName;
        form.elements['phone'].value = phone;
        form.elements['email'].value = email;
        form.elements['date'].value = formattedDate;
        form.elements['time'].value = formattedTime;
        form.elements['people'].value = people;
        form.elements['table'].value = table;
        form.elements['observations'].value = observations;
        
        // Cambiar el formulario a modo de actualización
        form.dataset.editId = id;
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Actualizar Reserva';
        }
        
        // Mostrar el modal
        showAddReservationModal();
        
    } catch (error) {
        console.error('Error al cargar la reserva para editar:', error);
        
        // Mostrar mensaje de error detallado
        let errorMessage = 'Error al cargar la reserva para editar';
        if (error.response) {
            try {
                const errorData = await error.response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                console.error('Error al analizar la respuesta de error:', e);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    }
}

// Load calendar events from the API
async function loadCalendarEvents(timeMin, timeMax) {
    try {
        console.log('Cargando eventos del calendario...');
        
        // Use provided range, or default to today
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const min = timeMin || now.toISOString();
        const max = timeMax || endOfDay.toISOString();
        
        console.log(`Buscando eventos entre ${min} y ${max}`);
        
        // Hacer la petición a la API de reservas
        const events = await apiRequest(`/reservations?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}`);
        
        // Verificar la respuesta
        if (!Array.isArray(events)) {
            console.error('La respuesta de la API no es un array:', events);
            return [];
        }
        
        console.log('Eventos del calendario cargados:', events);
        
        return events;
    } catch (error) {
        console.error('Error al cargar eventos del calendario:', error);
        showNotification('Error al cargar eventos del calendario', 'error');
        return [];
    }
}

// Update the UI with calendar events in a table format
function updateCalendarEventsUI(events) {
    try {
        const eventsContainer = document.getElementById('upcoming-events');
        if (!eventsContainer) {
            console.warn('No se encontró el contenedor de próximas reservas');
            return;
        }
        
        if (!Array.isArray(events) || events.length === 0) {
            eventsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 py-4">No hay reservas programadas</p>';
            return;
        }
        
        // Ordenar eventos por fecha
        const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
        
        // Mostrar todos los eventos del día actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents = sortedEvents.filter(event => {
            const eventDate = new Date(event.start);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === today.getTime();
        });
        
        // Función para extraer información del título y descripción
        const parseEventInfo = (event) => {
            const title = event.summary || 'Reserva';
            const startDate = new Date(event.start.dateTime || event.start.date);
            const endDate = new Date(event.end.dateTime || event.end.date);
            
            // Extraer información adicional del título
            const titleMatch = title.match(/(.*?)\s*\((\d+)\s*pax\)/i);
            const customerName = titleMatch ? titleMatch[1].trim() : title;
            const people = titleMatch ? parseInt(titleMatch[2], 10) : 1;
            
            // Extraer número de mesa de la descripción si está disponible
            let table = '';
            if (event.description) {
                const tableMatch = event.description.match(/Mesa:\s*(\d+|S\/N)/i);
                table = tableMatch ? tableMatch[1] : '';
            }
            
            return {
                customerName,
                people,
                table: table || 'S/N',
                startTime: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                date: startDate,
                event
            };
        };
        
        // Generar filas de la tabla
        const tableRows = upcomingEvents.map(event => {
            const info = parseEventInfo(event);
            return `
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="py-3 px-2">
                        <div class="font-medium text-gray-900 dark:text-white">${info.customerName}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            ${info.date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </div>
                    </td>
                    <td class="py-3 px-2">
                        <div class="text-sm text-gray-900 dark:text-white">${info.startTime}</div>
                    </td>
                    <td class="py-3 px-2">
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            ${info.people} ${info.people === 1 ? 'persona' : 'personas'}
                        </span>
                    </td>
                    <td class="py-3 px-2">
                        <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Mesa ${info.table}
                        </span>
                    </td>
                    <td class="py-3 px-2 text-right">
                        <div class="flex justify-end space-x-2">
                            <button onclick="editReservation('${event.id}')" class="text-blue-500 hover:text-blue-700" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="cancelReservation('${event.id}')" class="text-red-500 hover:text-red-700" title="Cancelar">
                                <i class="fas fa-times"></i>
                            </button>
                            <a href="${event.htmlLink}" target="_blank" class="text-gray-500 hover:text-gray-700" title="Ver en Google Calendar">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Crear la tabla completa
        const tableHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                            <th class="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-300">Cliente</th>
                            <th class="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-300">Hora</th>
                            <th class="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-300">Personas</th>
                            <th class="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-300">Mesa</th>
                            <th class="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
        
        eventsContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error al actualizar la interfaz de reservas:', error);
        eventsContainer.innerHTML = '<p class="text-red-500 py-4">Error al cargar las reservas. Intente recargar la página.</p>';
    }
}

// Google Calendar Integration
async function syncWithGoogleCalendar() {
    try {
        // This would be implemented to sync with Google Calendar
        // For now, we'll just show a message
        showNotification('Sincronización con Google Calendar iniciada', 'info');
        
        await loadCalendarEvents();
        
        showNotification('Sincronización con Google Calendar completada', 'success');
    } catch (error) {
        console.error('Error syncing with Google Calendar:', error);
        showNotification('Error al sincronizar con Google Calendar', 'error');
    }
}
