import { supabase } from '../lib/customSupabaseClient.js';

async function checkBookings() {
  console.log('Fetching all bookings from database...');
  try {
    const { data: bookings, error } = await supabase.from('bookings').select('*');
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    console.log(`Found ${bookings.length} bookings.`);
    const invalidBookings = [];
    const locationIds = new Set();
    
    bookings.forEach(b => {
      locationIds.add(b.location_id);
      if (b.location_id && !b.location_id.includes('-')) {
        invalidBookings.push(b);
      }
    });

    console.log('Unique location_ids found in bookings table:', Array.from(locationIds));
    if (invalidBookings.length > 0) {
      console.log('Bookings with INVALID (non-UUID) location_id:', invalidBookings);
    } else {
      console.log('All bookings have UUID-like location_ids!');
    }
  } catch (err) {
    console.error('System error:', err);
  }
}

checkBookings();
