import { supabase } from '../lib/customSupabaseClient.js';

async function checkServices() {
  console.log('Fetching services sample from database...');
  try {
    const { data: services, error } = await supabase.from('services').select('*').limit(3);
    if (error) {
      console.error('Error fetching services:', error);
      return;
    }

    console.log('Services count in sample:', services.length);
    console.log('Services sample:', services);
  } catch (err) {
    console.error('System error:', err);
  }
}

checkServices();
