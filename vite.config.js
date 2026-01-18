import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig(function (_a) {
    var _b;
    var command = _a.command;
    var base = (_b = process.env.VITE_BASE_PATH) !== null && _b !== void 0 ? _b : (command === 'build' ? './' : '/');
    return {
        base: base,
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src')
            }
        },
        server: {
            port: 5173,
            host: '0.0.0.0'
        }
    };
});
