const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTablesDirectly() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔧 Creando tablas directamente en Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Service Key:', supabaseServiceKey ? 'Configurada ✅' : 'No configurada ❌');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
        // Verificar si las tablas ya existen intentando hacer una consulta simple
        console.log('\n📋 Verificando tabla menu...');
        const { data: menuCheck, error: menuError } = await supabase
            .from('menu')
            .select('count')
            .limit(1);
            
        if (menuError && menuError.code === 'PGRST106') {
            console.log('❌ Tabla menu no existe');
        } else if (menuError) {
            console.log('❌ Error verificando menu:', menuError.message);
        } else {
            console.log('✅ Tabla menu ya existe');
        }
        
        console.log('\n📋 Verificando tabla orders...');
        const { data: ordersCheck, error: ordersError } = await supabase
            .from('orders')
            .select('count')
            .limit(1);
            
        if (ordersError && ordersError.code === 'PGRST106') {
            console.log('❌ Tabla orders no existe');
        } else if (ordersError) {
            console.log('❌ Error verificando orders:', ordersError.message);
        } else {
            console.log('✅ Tabla orders ya existe');
        }
        
        console.log('\n📋 Verificando tabla reservations...');
        const { data: reservationsCheck, error: reservationsError } = await supabase
            .from('reservations')
            .select('count')
            .limit(1);
            
        if (reservationsError && reservationsError.code === 'PGRST106') {
            console.log('❌ Tabla reservations no existe');
        } else if (reservationsError) {
            console.log('❌ Error verificando reservations:', reservationsError.message);
        } else {
            console.log('✅ Tabla reservations ya existe');
        }
        
        // Intentar insertar un registro de prueba en menu para verificar acceso
        console.log('\n🧪 Probando inserción en menu...');
        const { data: testInsert, error: insertError } = await supabase
            .from('menu')
            .insert([
                {
                    nombre: 'Test Item',
                    precio: 9.99,
                    categoria: 'test',
                    ingredientes: 'Item de prueba',
                    stock: 10
                }
            ])
            .select();
            
        if (insertError) {
            console.log('❌ Error insertando en menu:', insertError.message);
            console.log('Código de error:', insertError.code);
        } else {
            console.log('✅ Inserción exitosa en menu:', testInsert);
            
            // Eliminar el registro de prueba
            const { error: deleteError } = await supabase
                .from('menu')
                .delete()
                .eq('name', 'Test Item');
                
            if (deleteError) {
                console.log('⚠️  Error eliminando registro de prueba:', deleteError.message);
            } else {
                console.log('✅ Registro de prueba eliminado');
            }
        }
        
    } catch (error) {
        console.error('💥 Error general:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTablesDirectly()
        .then(() => {
            console.log('\n🎉 Verificación completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { createTablesDirectly };
