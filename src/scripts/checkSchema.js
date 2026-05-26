import { supabase } from '../lib/customSupabaseClient.js';

async function checkSchema() {
  console.log('Fetching table list or some data to examine keys...');
  
  try {
    const { data: bookings, error: bError } = await supabase.from('bookings').select('*').limit(1);
    if (bError) {
      console.error('Bookings error:', bError);
    } else {
      console.log('Bookings columns:', bookings.length > 0 ? Object.keys(bookings[0]) : 'Empty table, let us check columns through postgres');
      console.log('Bookings sample:', bookings[0]);
    }

    const { data: locations, error: lError } = await supabase.from('locations').select('*').limit(1);
    if (lError) {
      console.error('Locations error:', lError);
    } else {
      console.log('Locations columns:', locations.length > 0 ? Object.keys(locations[0]) : 'Empty table');
      console.log('Locations sample:', locations[0]);
    }

    const { data: bookingServices, error: bsError } = await supabase.from('booking_services').select('*').limit(1);
    if (bsError) {
      console.error('BookingServices error:', bsError);
    } else {
      console.log('BookingServices columns:', bookingServices.length > 0 ? Object.keys(bookingServices[0]) : 'Empty table');
      console.log('BookingServices sample:', bookingServices[0]);
    }
    
    // We can also query pg catalog to see the columns of bookings
    console.log('Querying column types for bookings...');
    const { data: columns, error: cError } = await supabase.rpc('get_table_columns', { table_name: 'bookings' });
    if (cError) {
      // If no RPC, we can try querying via REST using postgrest internal tables or just testing types
      console.log('RPC get_table_columns failed, attempting custom select from pg_catalog or information_schema...');
      // By default postgrest does not expose pg_catalog, so we might get access denied. Let's try:
      const { data: infoSchema, error: isError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'bookings');
      if (isError) {
        console.error('Failed to query information_schema:', isError);
      } else {
        console.log('Bookings schema from info schema:', infoSchema);
      }
    } else {
      console.log('Bookings columns types:', columns);
    }

  } catch (err) {
    console.error('System error:', err);
  }
}

checkSchema();
