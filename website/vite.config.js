import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    // Load env from the same directory as this vite.config.js file
    const env = loadEnv(mode, __dirname, '')

    return {
        plugins: [react()],
        define: {
            // Spread all env vars prefixed with VITE_
            ...Object.fromEntries(
                Object.entries(env)
                    .filter(([key]) => key.startsWith('VITE_'))
                    .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
            ),
        }
    }
})
