import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid TS errors regarding 'cwd'
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely inject ONLY the API key. 
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});