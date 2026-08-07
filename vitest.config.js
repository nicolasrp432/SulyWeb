import { defineConfig } from 'vitest/config';

// Config aislada para los tests de lógica pura (sin los plugins de dev de Vite).
export default defineConfig({
  test: {
    environment: 'node',
    // También la lógica pura compartida por las Edge Functions (formato de los
    // avisos): es JS normal, sin APIs de Deno, y conviene tenerla cubierta.
    include: ['src/**/*.test.{js,jsx}', 'supabase/functions/**/*.test.js'],
  },
});
