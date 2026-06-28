# Test Suite Documentation

## Overview

The test suite for TaskPlanner is designed to be comprehensive and robust, aiming for high coverage and reliability. It uses Vitest as the test runner and includes multiple types of tests:

1. **Unit Tests** - Tests individual functions and components
2. **Property-Based Tests** - Uses fast-check to verify properties hold across a wide range of inputs
3. **Snapshot Tests** - Ensures API responses and component outputs remain consistent
4. **Integration Tests** - Tests how different parts of the system work together
5. **End-to-End Tests** - Tests complete user flows (using Playwright)

## Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── hooks/           # Custom React hooks tests
│   ├── utils/           # Utility function tests
│   ├── api/             # API route tests
│   └── ...              # Other unit tests
├── property/            # Property-based tests (using fast-check)
├── snapshot/            # Snapshot tests
├── e2e/                 # End-to-end tests
└── setup.ts             # Test setup file
```

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only snapshot tests
npm run test:snapshot

# Run stress/performance tests
npm run test:stress
```

### CI/CD

```bash
# Run full test suite with coverage (used in CI)
npm run ci:test

# Run E2E tests with tracing (used in CI)
npm run ci:e2e
```

## Coverage Requirements

The test suite enforces strict coverage thresholds:
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

These thresholds are designed to ensure that critical code paths are tested.

## Types of Tests

### Unit Tests
Test individual functions, hooks, and utilities in isolation.

Example: `tests/unit/utils/test-helpers.test.ts`

### Property-Based Tests
Use random input generation to verify that properties hold true across a wide range of inputs.

Example: `tests/property/task-validation.test.ts`

### Snapshot Tests
Ensure that the output of functions or components doesn't change unexpectedly.

Example: `tests/snapshot/api-routes.snapshot.test.ts`

### Integration Tests
Test how multiple components work together.

Example: `tests/integration/auth-flow.test.ts`

### End-to-End Tests
Test complete user flows from start to finish.

Example: `tests/e2e/user-journey.test.ts`

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested and the expected outcome.
2. **Arrange-Act-Assert**: Structure tests using this pattern for clarity.
3. **Mocking**: Mock external dependencies (APIs, databases, etc.) to make tests fast and reliable.
4. **Test Data**: Use factories or builders for creating test data (see `test-helpers.ts`).
5. **Isolation**: Each test should be independent and not rely on the state of other tests.
6. **Cleanup**: Always clean up after tests (e.g., clear mocks, reset state).

## Adding New Tests

When adding new features:
1. Create a test file in the appropriate directory under `tests/`
2. Follow the existing naming conventions
3. Ensure tests cover both happy path and edge cases
4. Run the full test suite to verify nothing is broken
5. Check that coverage doesn't drop below thresholds

## Troubleshooting

If tests are flaky:
1. Check for shared state between tests
2. Ensure proper mocking/resetting of mocks
3. Look for asynchronous code that isn't properly awaited
4. Consider increasing timeouts if necessary
5. Use the `test:watch` flag to debug interactively

## Continuous Improvement

The test suite should be regularly reviewed and improved:
- Remove brittle tests that frequently fail for non-code reasons
- Add tests for newly discovered edge cases
- Update tests when requirements change
- Consider adding mutation testing to assess test quality