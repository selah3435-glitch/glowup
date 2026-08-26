import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

const emulateNetlify = process.env.NETLIFY_DEV === '1'

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    ...(emulateNetlify ? [netlify()] : []),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    watch: {
      ignored: ['**/.netlify/**'],
    },
  },
})

export default config
