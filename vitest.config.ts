import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/app/**',
        'src/pages/**',
        'src/components/ui/**',
        'src/styles/**',
        'src/**/*.d.ts',
        'src/features/**/types/**',
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**',
      ],
    },
  },
})
