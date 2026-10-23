import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const { TIMEPAD_API_TOKEN = '' } = loadEnv(mode, '.', '')
  const proxies = {
    '/api/kudago': {
      target: 'https://kudago.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/api\/kudago/, '/public-api'),
    },
    '/api/timepad': {
      target: 'https://api.timepad.ru',
      changeOrigin: true,
      secure: true,
      ...(TIMEPAD_API_TOKEN ? { headers: { Authorization: `Bearer ${TIMEPAD_API_TOKEN}` } } : {}),
      rewrite: (path: string) => path.replace(/^\/api\/timepad/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy: proxies },
    preview: { proxy: proxies },
  }
})
