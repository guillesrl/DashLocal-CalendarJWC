const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;  // Asegurarse de que esté usando la clave correcta

console.log('🔧 Configurando Supabase...');
console.log('📡 URL de Supabase:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
console.log('🔑 Clave de Supabase:', supabaseKey ? '✅ Configurada' : '❌ No configurada');

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno de Supabase no configuradas correctamente');
    console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌ No configurada');
    console.error('SUPABASE_KEY:', supabaseKey ? '✅' : '❌ No configurada');
} else {
    try {
        // Crear cliente de Supabase solo si las variables están disponibles
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Cliente de Supabase inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar el cliente de Supabase:', error.message);
    }
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
