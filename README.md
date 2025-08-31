# Restaurant Dashboard con PostgreSQL y Google Calendar

Dashboard de gestión para restaurantes con integración completa de PostgreSQL y Google Calendar usando Service Account.

## Características

- **Gestión de Menú**: CRUD completo para elementos del menú
- **Gestión de Órdenes**: Seguimiento de pedidos y estados
- **Gestión de Reservas**: Sistema de reservas con sincronización automática a Google Calendar
- **Persistencia PostgreSQL**: Almacenamiento robusto en base de datos
- **Integración Google Calendar**: Sincronización automática de reservas usando Service Account
- **API REST**: Backend completo con endpoints para todas las operaciones

## Requisitos Previos

1. **Node.js** (v14 o superior)
2. **PostgreSQL** (v12 o superior)
3. **Google Service Account** configurado con acceso a Google Calendar API

## Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar PostgreSQL**:
```bash
# Crear base de datos
createdb restaurant_dashboard

# O usando psql
psql -U postgres
CREATE DATABASE restaurant_dashboard;
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

4. **Inicializar base de datos**:
```bash
npm run init-db
```

5. **Configurar Google Service Account**:
   - Asegúrate de que `service-account-key.json` esté en el directorio raíz
   - El calendario debe estar compartido con el email del Service Account
   - Permisos: "Realizar cambios en eventos"

## Uso

1. **Iniciar servidor**:
```bash
npm start
# o para desarrollo
npm run dev
```

2. **Acceder al dashboard**:
```
http://localhost:3000
```

## Estructura de la Base de Datos

### Tabla `menu_items`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `price` (DECIMAL)
- `category` (VARCHAR)
- `description` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabla `orders`
- `id` (SERIAL PRIMARY KEY)
- `table_number` (INTEGER)
- `items` (JSONB)
- `total` (DECIMAL)
- `status` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabla `reservations`
- `id` (SERIAL PRIMARY KEY)
- `customer_name` (VARCHAR)
- `phone` (VARCHAR)
- `date` (DATE)
- `time` (TIME)
- `people` (INTEGER)
- `table_number` (INTEGER)
- `status` (VARCHAR)
- `google_event_id` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

## API Endpoints

### Menú
- `GET /api/menu` - Obtener todos los elementos
- `POST /api/menu` - Crear nuevo elemento
- `PUT /api/menu/:id` - Actualizar elemento
- `DELETE /api/menu/:id` - Eliminar elemento

### Órdenes
- `GET /api/orders` - Obtener todas las órdenes
- `POST /api/orders` - Crear nueva orden
- `PUT /api/orders/:id` - Actualizar orden
- `DELETE /api/orders/:id` - Eliminar orden

### Reservas
- `GET /api/reservations` - Obtener todas las reservas
- `POST /api/reservations` - Crear nueva reserva (+ Google Calendar)
- `PUT /api/reservations/:id` - Actualizar reserva (+ Google Calendar)
- `DELETE /api/reservations/:id` - Eliminar reserva (+ Google Calendar)

### Utilidad
- `GET /api/health` - Estado del servidor y base de datos

## Configuración de Google Calendar

1. **Service Account**: `webflask@ordinal-bucksaw-450511-j0.iam.gserviceaccount.com`
2. **Calendar ID**: `2385d6833d1b3a264fea105c8e3b81c996a274bafe7f42ee742b92cccc783801@group.calendar.google.com`
3. **Permisos**: El calendario debe estar compartido con el Service Account

## Funcionalidades

- **Sincronización automática**: Las reservas se crean/actualizan/eliminan automáticamente en Google Calendar
- **Persistencia dual**: Datos en PostgreSQL + backup en localStorage
- **Manejo de errores**: Notificaciones de éxito/error en la interfaz
- **Modo offline**: Fallback a localStorage si la API no está disponible

## Desarrollo

```bash
# Modo desarrollo con auto-reload
npm run dev

# Verificar estado de la base de datos
curl http://localhost:3000/api/health
```
