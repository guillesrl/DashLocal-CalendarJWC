# Configuración de Supabase API Keys

## Pasos para obtener las API Keys de Supabase

1. **Accede a tu proyecto de Supabase:**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto: `eyqumoiygfbfvxvzupgy`

2. **Obtén las API Keys:**
   - En el dashboard, ve a **Settings** → **API**
   - Copia las siguientes keys:
     - **Project URL**: `https://eyqumoiygfbfvxvzupgy.supabase.co`
     - **anon public**: Esta es tu `SUPABASE_ANON_KEY`
     - **service_role**: Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (¡mantén esta privada!)

3. **Actualiza el archivo .env:**
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://eyqumoiygfbfvxvzupgy.supabase.co
   SUPABASE_ANON_KEY=tu_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

## Cambios realizados en la migración

✅ **Instalado**: `@supabase/supabase-js`
✅ **Actualizado**: `config/database.js` - Ahora usa cliente de Supabase
✅ **Actualizado**: `routes/menu.js` - Convertido a queries de Supabase
✅ **Actualizado**: `routes/orders.js` - Convertido a queries de Supabase
✅ **Actualizado**: `routes/reservations.js` - Convertido a queries de Supabase

## Ventajas de usar Supabase API

- **Seguridad mejorada**: Row Level Security (RLS)
- **Mejor rendimiento**: Conexiones optimizadas
- **Funciones avanzadas**: Real-time subscriptions, Auth integrado
- **Escalabilidad**: Manejo automático de conexiones
- **Facilidad de uso**: Queries más simples y legibles

## Próximos pasos

1. Obtén y configura las API keys en el archivo `.env`
2. Ejecuta `npm start` para probar la aplicación
3. Verifica que todos los endpoints funcionen correctamente

## Comandos para probar

```bash
# Iniciar el servidor
npm start

# Probar endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/menu
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/reservations
```
