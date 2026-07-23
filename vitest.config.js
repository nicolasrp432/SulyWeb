import { defineConfig } from 'vitest/config';

// Config aislada para los tests de lógica pura (sin los plugins de dev de Vite).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
