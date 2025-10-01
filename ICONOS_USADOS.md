# Iconos Font Awesome Utilizados en el Dashboard

Este documento lista todos los iconos de Font Awesome utilizados en la aplicación.

## Iconos Solid (fas)

### Navegación y UI
- `fa-bars` - Menú hamburguesa (móvil)
- `fa-moon` / `fa-sun` - Toggle modo oscuro
- `fa-times` - Cerrar modales/cancelar
- `fa-tachometer-alt` - Dashboard
- `fa-utensils` - Menú de comida
- `fa-clipboard-list` - Pedidos
- `fa-calendar-alt` - Reservas/Calendario
- `fa-dollar-sign` - Ingresos

### Acciones
- `fa-plus` - Agregar nuevo item
- `fa-edit` - Editar
- `fa-trash` - Eliminar
- `fa-sync-alt` - Actualizar/Recargar
- `fa-spinner` (con `fa-spin`) - Indicador de carga
- `fa-external-link-alt` - Enlace externo

## Iconos Brands (fab)

### Integraciones
- `fa-google` - Sincronización con Google Calendar

## Optimización Implementada

En lugar de cargar toda la biblioteca de Font Awesome (~900KB), ahora solo cargamos:
- `fontawesome.min.css` - Core (necesario)
- `solid.min.css` - Iconos sólidos (~70KB)
- `brands.min.css` - Iconos de marcas (~20KB)

**Ahorro aproximado:** ~810KB (90% de reducción)

## Notas

- Si necesitas agregar nuevos iconos, verifica que estén en las categorías "solid" o "brands"
- Si necesitas iconos "regular" o "light", agrega el archivo CSS correspondiente
- Versión actual: Font Awesome 6.5.1
