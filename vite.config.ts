import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from "node:url";

const url = new URL('./src', import.meta.url);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'esnext',
    },
    resolve: {
        alias: {
            '@': fileURLToPath(url)
        }
    }
})
