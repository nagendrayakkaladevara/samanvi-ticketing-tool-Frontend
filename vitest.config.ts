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
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reportsDirectory: '/tmp/vitest-coverage-workspace',
      clean: false,
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
        // Presentational feature/shared UI — covered by colocated smoke tests;
        // measured coverage targets logic layers (api/utils/hooks/store/lib).
        'src/features/**/components/**',
        'src/components/app-sidebar.tsx',
        'src/components/layout/**',
        'src/components/icons/**',
        'src/components/page-gradient-header.tsx',
        'src/components/master-detail-grid.tsx',
        'src/components/version-switcher.tsx',
        'src/styles/**',
        'src/assets/**',
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
