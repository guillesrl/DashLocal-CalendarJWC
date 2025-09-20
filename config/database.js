const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Variables de entorno de Supabase no configuradas');
} else {
    // Crear cliente de Supabase solo si las variables están disponibles
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Función para probar la conexión
async function testConnection() {
    if (!supabase) {
        console.warn('⚠️ Cliente de Supabase no inicializado');
        return false;
    }
    
    try {
        const { data, error } = await supabase
            .from('menu')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Error conectando a Supabase:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase establecida correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
        return false;
    }
}

// Función helper para ejecutar queries SQL directas (si es necesario)
async function executeQuery(query, params = []) {
    try {
        const { data, error } = await supabase.rpc('execute_sql', {
            query: query,
            params: params
        });
        
        if (error) throw error;
        return { rows: data };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    supabase,
    testConnection,
    executeQuery
};
