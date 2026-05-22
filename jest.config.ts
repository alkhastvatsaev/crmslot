import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  forceExit: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/_prototype_backup/', '<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/tests/e2e/', '/__tests__/fixtures/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-utils/**',
    // Next route handlers are mostly integration-tested; excluding them avoids skewing the global *function* ratio (many 1-export files).
    '!src/app/api/**/*.ts',
    'src/app/api/demo/client-audio/**/*.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/app/technician/page.tsx',
    '!src/features/technicians/components/**',
  ],
  coverageThreshold: {
    global: {
      statements: 4,
      branches: 20,
      functions: 7,
      lines: 4,
    },
    // Modules métier P0 (fichiers ciblés — pas le dossier entier, trop de composants UI non couverts).
    './src/features/interventions/assignInterventionToTechnician.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './src/features/interventions/technicianAssignmentActions.ts': {
      statements: 90,
      branches: 70,
      functions: 100,
      lines: 90,
    },
    './src/features/interventions/technicianSchedule.ts': {
      statements: 48,
      branches: 60,
      functions: 50,
      lines: 48,
    },
    './src/features/interventions/technicianAssignmentsFilter.ts': {
      statements: 85,
      branches: 70,
      functions: 100,
      lines: 85,
    },
    './src/features/interventions/mapTechnicianMissions.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './src/core/ui/dashboardDesktopLayout.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    // Chatbot P0 — ratchet progressif (voir docs/TESTING.md §3.4).
    './src/features/chatbot/chatbot-pwa-intent.ts': {
      statements: 65,
      branches: 75,
      functions: 90,
      lines: 65,
    },
    './src/features/chatbot/chatbot-address-disambiguation.ts': {
      statements: 72,
      branches: 58,
      functions: 85,
      lines: 72,
    },
    './src/features/chatbot/chatbot-route-handler.ts': {
      statements: 75,
      branches: 60,
      functions: 75,
      lines: 75,
    },
    './src/features/chatbot/chatbot-document-action-handler.ts': {
      statements: 65,
      branches: 50,
      functions: 100,
      lines: 65,
    },
    './src/features/chatbot/chatbot-tool-routing.ts': {
      statements: 85,
      branches: 50,
      functions: 100,
      lines: 85,
    },
    './src/features/chatbot/chatbot-tool-executor.ts': {
      statements: 65,
      branches: 38,
      functions: 70,
      lines: 65,
    },
    // Page 2 — portail client
    './src/features/interventions/context/RequesterHubContext.tsx': {
      statements: 80,
      branches: 70,
      functions: 90,
      lines: 80,
    },
    './src/features/interventions/components/RequesterInterventionPanel.tsx': {
      statements: 40,
      branches: 30,
      functions: 18,
      lines: 40,
    },
    // Logique Firestore critique
    './src/features/clients/linkInterventionToClient.ts': {
      statements: 80,
      branches: 60,
      functions: 100,
      lines: 80,
    },
  },
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // qrcode is only used in generateEquipmentQrDataUrl — not in scope for unit tests
    '^qrcode$': '<rootDir>/src/__mocks__/qrcode.ts',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
