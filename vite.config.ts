import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const kudagoProxy = {
  '/api/kudago': {
    target: 'https://kudago.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path: string) => path.replace(/^\/api\/kudago/, '/public-api'),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: kudagoProxy },
  preview: { proxy: kudagoProxy },
})
