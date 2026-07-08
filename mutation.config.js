// Mutation Testing Configuration for CBest
// This file configures mutation testing for the TaskPlanner project

export default {
  // Mutations to apply
  mutators: [
    'arrow-function-to-expression',
    'arrow-function-to-shorthand-property',
    'assignment-to-constant',
    'block-statements-to-expressions',
    'boolean-invert',
    'conditional-to-conditional-operator',
    'conditional-to-ternary',
    'conditional-to-optional-chaining',
    'conditional-to-optional-call',
    'divide-to-multiply',
    'equality-to-inequality',
    'expression-statement',
    'for-loop-to-while-loop',
    'function-call-expression-to-undefined',
    'function-declaration-to-expression',
    'import-to-require',
    'increment-to-decrement',
    'inline-constant',
    'math-add-to-subtract',
    'math-subtract-to-add',
    'negate-to-add',
    'negate-to-subtract',
    'negate-to-multiply',
    'negate-to-divide',
    'negate-to-modulo',
    'negate-to-power',
    'negate-to-left-shift',
    'negate-to-right-shift',
    'negate-to-unsigned-right-shift',
    'negate-to-bitwise-and',
    'negate-to-bitwise-or',
    'negate-to-bitwise-xor',
    'negate-to-logical-not',
    'object-property-assignment',
    'object-property-assignment-to-undefined',
    'object-property-deletion',
    'object-property-to-assignment',
    'object-property-to-method',
    'predefined-object-to-null',
    'predefined-object-to-undefined',
    'predefined-value-to-undefined',
    'prefix-to-postfix',
    'prefix-to-infix',
    'property-to-method',
    'replace-boolean-literal',
    'replace-integer-literal',
    'replace-string-literal',
    'replace-undefined-with-null',
    'return-to-assignment',
    'reverse-arguments',
    'reverse-conditionals',
    'swap-operands',
    'ternary-to-conditional',
    'unary-to-postfix',
    'unary-to-prefix',
    'unary-to-binary',
    'unwrap-boolean',
    'unwrap-integer',
    'unwrap-string',
    'wrap-in-array',
    'wrap-in-object',
    'wrap-in-template-literal',
  ],

  // Files to mutate
  files: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.config.ts',
    '!src/**/types/index.ts',
    '!src/**/index.ts',
    '!src/**/constants.ts',
    '!src/lib/env.ts',
  ],

  // Files to exclude from mutation
  exclude: [
    'node_modules/**',
    'dist/**',
    '.next/**',
    'coverage/**',
    'tests/**',
    'jest.config.js',
    'vitest.config.ts',
    'next.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
  ],

  // Thresholds for mutation score
  thresholds: {
    high: 80,
    warn: 60,
  },

  // Test runner configuration
  testRunner: {
    command: 'vitest run',
    // Optional: specify test files pattern
    // files: 'tests/**/*.test.{ts,tsx}',
  },

  // Report configuration
  reporters: ['text', 'html', 'json'],

  // Whether to fail the build if mutation score is below threshold
  failUnder: {
    statement: 80,
    branch: 80,
    function: 80,
    line: 80,
  },

  // Timeout for each mutation test (in milliseconds)
  timeout: 5000,

  // Number of times to retry failed mutation tests
  retries: 2,
};