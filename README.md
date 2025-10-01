# Restaurant Dashboard con Supabase y Google Calendar

Dashboard de gestión para restaurantes con integración de Supabase y Google Calendar usando Service Account.

## Características

- **Gestión de Menú**: CRUD completo para elementos del menú
- **Gestión de Órdenes**: Seguimiento de pedidos y estados
- **Gestión de Reservas**: Sistema de reservas con sincronización automática a Google Calendar
- **Persistencia en la nube**: Almacenamiento con Supabase (PostgreSQL)
- **Integración Google Calendar**: Sincronización automática de reservas usando Service Account
- **API REST**: Backend completo con endpoints para todas las operaciones
- **Modo oscuro**: Interfaz adaptable con soporte para tema claro/oscuro

## Requisitos Previos

1. **Node.js** (v14 o superior)
2. **Cuenta de Supabase** (gratuita)
3. **Google Service Account** configurado con acceso a Google Calendar API

## Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar Supabase**:
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Obtén tus API keys desde **Settings → API**
   - Ver guía detallada en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

3. **Configurar variables de entorno**:
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega tus credenciales de Supabase:
   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

4. **Configurar Google Service Account**:
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

## Estructura de la Base de Datos (Supabase)

Las tablas se crean automáticamente en Supabase. Puedes usar los scripts SQL en el directorio raíz si necesitas recrearlas.

### Tabla `menu_items`
- `id` - Identificador único
- `name` - Nombre del plato
- `price` - Precio
- `category` - Categoría (entradas, platos-principales, postres, bebidas)
- `description` - Descripción del plato
- `stock` - Cantidad disponible
- `created_at`, `updated_at` - Timestamps automáticos

### Tabla `orders`
- `id` - Identificador único
- `customer_name` - Nombre del cliente
- `phone` - Teléfono de contacto
- `direccion` - Dirección de entrega
- `items` - Items del pedido (texto)
- `total` - Total del pedido
- `status` - Estado (pendiente, en-preparacion, completado, cancelado)
- `created_at`, `updated_at` - Timestamps automáticos

### Tabla `reservations`
- `id` - Identificador único
- `customer_name` - Nombre del cliente
- `phone` - Teléfono de contacto
- `date` - Fecha de la reserva
- `time` - Hora de la reserva
- `people` - Número de personas
- `table_number` - Número de mesa
- `observations` - Observaciones especiales
- `google_event_id` - ID del evento en Google Calendar
- `created_at`, `updated_at` - Timestamps automáticos

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
- **Persistencia en la nube**: Datos almacenados en Supabase con backup en localStorage
- **Manejo de errores**: Notificaciones de éxito/error en la interfaz
- **Modo offline**: Fallback a localStorage si la API no está disponible
- **Interfaz responsive**: Diseño adaptable para móviles, tablets y escritorio
- **Modo oscuro**: Tema claro/oscuro con preferencia guardada
- **Optimización de recursos**: Font Awesome optimizado (90% de reducción en tamaño)

## Tecnologías Utilizadas

### Frontend
- **HTML5 + CSS3**: Estructura y estilos
- **TailwindCSS**: Framework de utilidades CSS
- **JavaScript Vanilla**: Lógica del cliente
- **Font Awesome 6**: Iconografía optimizada

### Backend
- **Node.js + Express**: Servidor API REST
- **Supabase**: Base de datos PostgreSQL en la nube
- **Google Calendar API**: Sincronización de reservas
- **Service Account**: Autenticación con Google

### Herramientas
- **PostCSS + Autoprefixer**: Procesamiento de CSS
- **dotenv**: Gestión de variables de entorno

## Desarrollo

```bash
# Compilar estilos de Tailwind
npm run build

# Modo watch para desarrollo de estilos
npm run watch

# Iniciar servidor
npm start

# Verificar estado de la base de datos
curl http://localhost:3000/api/health
```

## Archivos de Configuración

- `tailwind.config.js` - Configuración de TailwindCSS
- `postcss.config.js` - Configuración de PostCSS
- `service-account-key.json` - Credenciales de Google Service Account
- `.env` - Variables de entorno (no incluido en el repo)

## Documentación Adicional

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guía de configuración de Supabase
- [ICONOS_USADOS.md](./ICONOS_USADOS.md) - Lista de iconos Font Awesome utilizados
