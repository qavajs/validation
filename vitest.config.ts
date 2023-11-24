import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ["src/**/*.ts"],
      exclude: ["/lib/", "/node_modules/"],
      branches: 80,
      functions: 90,
      lines: 90,
      statements: -10,
    },
    testTimeout: 20000
  }
})
