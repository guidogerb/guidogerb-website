import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
    // Load env from monorepo root
    const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')

    return {
        plugins: [react()],
        define: {
            // spread all prefixed vars
            ...Object.fromEntries(
                Object.entries(env)
                    .filter(([key]) => key.startsWith('VITE_'))
                    .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
            ),
        }
    }
})
