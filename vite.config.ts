import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'VisitaSegura - Fichas de Visita Digitais',
        short_name: 'VisitaSegura',
        description: 'Crie fichas de visita digitais com confirmação segura via WhatsApp e comprovantes PDF com QR Code',
        theme_color: '#0B3C5D',
        background_color: '#0B3C5D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/auth',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // Chat/streaming endpoints - always network only
            urlPattern: /^https:\/\/.*supabase\.co\/functions\/v1\/chat.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Edge functions - network first with short cache
            urlPattern: /^https:\/\/.*supabase\.co\/functions\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'edge-functions-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          },
          {
            // Other Supabase API calls - short cache for dynamic data
            urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 // 30 seconds - very short to prevent stale data
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
