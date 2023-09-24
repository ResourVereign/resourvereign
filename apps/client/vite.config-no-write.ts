import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    write: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['./src'],
        jit: true,
      },
    },
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
