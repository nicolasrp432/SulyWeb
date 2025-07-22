// Script para añadir servicios que faltan a la base de datos
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/customSupabaseClient';

// Configuración de Supabase
const supabaseUrl = 'https://qeuqspjpwybaxppqgehm.supabase.co';

// Función para crear cliente administrativo con service role key
function createAdminClient(serviceRoleKey) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Función para solicitar la service role key al usuario
function getServiceRoleKey() {
  // Crear un input personalizado ya que prompt() no funciona en algunos navegadores
  const key = window.prompt(
    'Para añadir servicios necesitas la SERVICE ROLE KEY de Supabase.\n\n' +
    'Puedes encontrarla en:\n' +
    '1. Ve a tu dashboard de Supabase\n' +
    '2. Selecciona tu proyecto\n' +
    '3. Ve a Settings > API\n' +
    '4. Copia la "service_role" key (NO la "anon" key)\n\n' +
    'Pega la service role key aquí:'
  );
  
  if (!key || key.trim() === '') {
    throw new Error('Service role key es requerida para esta operación');
  }
  
  return key.trim();
}

// Función para generar un UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Función para generar un slug a partir del nombre del servicio
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim('-'); // Remover guiones al inicio y final
}

// Función para verificar la estructura de la tabla services
async function checkServicesTableStructure() {
  try {
    console.log('Verificando estructura de la tabla services...');
    
    // Obtener un servicio para ver su estructura
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error al verificar la estructura:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.warn('No se encontraron servicios para verificar la estructura');
      return null;
    }
    
    // Mostrar la estructura del primer servicio
    console.log('Estructura de un servicio:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error al verificar estructura:', error);
    return null;
  }
}

// Servicios que faltan en la base de datos pero están en la página de servicios
const missingServices = [
  {
    name: 'Cortar + limar',
    duration: '30 min',
    price: '9,90€',
    category: 'nails'
  },
  {
    name: 'Manicura exprés',
    duration: '30 min',
    price: '11,90€',
    category: 'nails'
  },
  {
    name: 'Manicura semi exprés',
    duration: '40 min',
    price: '14,90€',
    category: 'nails'
  },
  {
    name: 'Manicura adicional',
    duration: '45 min',
    price: '16,90€',
    category: 'nails'
  },
  {
    name: 'Manicura completa spa',
    duration: '60 min',
    price: '19,90€',
    category: 'nails'
  },
  {
    name: 'Uñas baby boomer',
    duration: '90 min',
    price: '38,90€',
    category: 'nails'
  },
  {
    name: 'Relleno de acrílico',
    duration: '60 min',
    price: '25,00€',
    category: 'nails'
  },
  {
    name: 'Esmaltar pies',
    duration: '30 min',
    price: '14,90€',
    category: 'nails'
  },
  {
    name: 'Pedicura completa',
    duration: '60 min',
    price: '25,90€',
    category: 'nails'
  },
  {
    name: 'Pedicura completa semi / tradicional',
    duration: '60 min',
    price: '25,90€',
    category: 'nails'
  }
];

// Función para añadir los servicios a la base de datos
async function addMissingServices(customServices = null) {
  // Usar servicios personalizados si se proporcionan, sino usar los predeterminados
  const servicesToProcess = customServices || missingServices;
  try {
    // Solicitar la service role key al usuario
    const serviceRoleKey = getServiceRoleKey();
    const adminSupabase = createAdminClient(serviceRoleKey);
    
    // Primero verificamos la estructura de la tabla
    const sampleService = await checkServicesTableStructure();
    console.log('Iniciando la adición de servicios faltantes...');
    // Obtener el último ID de servicio para continuar la secuencia
    const { data: lastService, error: lastServiceError } = await supabase
      .from('services')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
      
    console.log('Respuesta de consulta del último servicio:', lastService);
    
    if (lastServiceError) {
      throw new Error(`Error al obtener el último ID de servicio: ${lastServiceError.message}`);
    }
    
    // Verificar si la tabla usa UUIDs o números enteros
    let useUUIDs = false;
    let lastId = 0;
    
    if (lastService && lastService.length > 0) {
      const currentId = lastService[0].id;
      console.log('Tipo de ID actual:', typeof currentId, 'Valor:', currentId);
      
      if (typeof currentId === 'string' && currentId.includes('-')) {
        useUUIDs = true;
        console.log('La tabla usa UUIDs para los IDs');
      } else {
        // Es un número, lo convertimos a entero
        lastId = parseInt(currentId, 10);
        if (isNaN(lastId)) {
          lastId = 0;
        }
        console.log('La tabla usa números enteros para los IDs');
      }
    }
    
    console.log(`Sistema de IDs detectado: ${useUUIDs ? 'UUID' : 'Enteros'}, último ID: ${lastId}`);
    
    // Preparar los servicios con IDs apropiados según el tipo detectado
    const servicesToAdd = servicesToProcess.map((service, index) => {
      // Generar ID según el tipo detectado
      const serviceId = useUUIDs ? generateUUID() : (lastId + index + 1);
      
      const serviceToAdd = {
        id: serviceId,
        name: service.name,
        slug: generateSlug(service.name),
        duration: service.duration,
        price: service.price
      };
      
      console.log(`Servicio ${index + 1}: ID generado = ${serviceToAdd.id}, tipo: ${typeof serviceToAdd.id}`);
      
      // Si la tabla tiene columna 'category', la añadimos
      if (sampleService && 'category' in sampleService) {
        serviceToAdd.category = service.category;
      } else if (sampleService && 'service_category' in sampleService) {
        // Si usa otro nombre para la categoría
        serviceToAdd.service_category = service.category;
      } else if (sampleService && 'type' in sampleService) {
        // Otra posible alternativa
        serviceToAdd.type = service.category;
      }
      
      return serviceToAdd;
    });
    
    console.log('Servicios a añadir:', servicesToAdd);
    
    // Insertar los servicios en la base de datos usando el cliente administrativo
    console.log('Intentando insertar servicios con la siguiente estructura:', JSON.stringify(servicesToAdd[0]));
    
    const { data, error } = await adminSupabase
      .from('services')
      .insert(servicesToAdd);
    
    if (error) {
      console.error('Error detallado al insertar servicios:', error);
      throw new Error(`Error al insertar servicios: ${error.message}`);
    }
    
    console.log('Respuesta de inserción:', data);
    console.log('Servicios añadidos correctamente:', data || 'No hay datos de retorno');
    return { success: true, message: `Se han añadido ${servicesToAdd.length} servicios correctamente.` };
    
  } catch (error) {
    console.error('Error en el proceso de adición de servicios:', error);
    return { success: false, message: error.message };
  }
}

// Exportar la función para usarla desde otro archivo
export { addMissingServices, missingServices };