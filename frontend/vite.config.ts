import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@outlive/shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
      '@supabase/supabase-js': fileURLToPath(
        new URL('../backend/node_modules/@supabase/supabase-js', import.meta.url)
      )
    }
  },
  server: {
    port: 5173
  }
});
