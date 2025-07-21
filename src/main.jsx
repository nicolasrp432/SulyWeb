
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { BookingCartProvider } from '@/contexts/BookingCartContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BookingCartProvider>
        <App />
      </BookingCartProvider>
    </AuthProvider>
  </React.StrictMode>
);
