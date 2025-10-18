# E2E Testing Guide

This document describes the end-to-end (E2E) testing setup for Chilly Movies using Playwright.

## Overview

E2E tests verify the complete user experience by simulating real user interactions with the application. Tests run against the actual UI and backend services.

## Test Framework

**Playwright** - Modern E2E testing framework with:
- Cross-browser support (Chromium, Firefox, WebKit)
- Automatic waiting and retry logic
- Built-in accessibility testing with axe-core
- Video and screenshot capture on failures
- CI/CD integration

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with debugger
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/app.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### CI Environment

Tests run automatically on GitHub Actions for:
- Push to main/develop branches
- Pull requests
- Multiple OS: Ubuntu, Windows, macOS
- Multiple Node versions: 18.x, 20.x

## Test Structure

```
e2e/
├── app.spec.ts          # Main application flow tests
├── accessibility.spec.ts # Accessibility compliance tests
└── fixtures/            # Test data and helpers
```

## Test Categories

### 1. User Flow Tests

**app.spec.ts** - Core user journeys:
- Application loading
- Navigation between views
- Search functionality (metadata & torrents)
- Mode switching (catalog ↔ torrents)
- Settings management
- Error handling

### 2. Accessibility Tests

Tests WCAG 2.1 AA compliance:
- ARIA labels present
- Keyboard navigation works
- Focus indicators visible
- Screen reader compatibility
- Color contrast sufficient

### 3. Error Handling Tests

Verifies graceful degradation:
- Network failures
- Invalid inputs
- Missing data
- Offline mode

## Writing Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup code
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.click('text=View Name');
    
    // Act
    await page.fill('input[type="text"]', 'search query');
    await page.click('button[type="submit"]');
    
    // Assert
    await expect(page.locator('.result-card')).toBeVisible();
  });
});
```

### Accessibility Test Example

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Best Practices

### 1. Use Semantic Selectors

```typescript
// Good - semantic, resilient
await page.click('text=Discovery');
await page.locator('button[aria-label="Download"]').click();

// Bad - brittle, implementation-dependent
await page.click('.btn-primary-123');
await page.locator('#download-button-456').click();
```

### 2. Wait for Elements

```typescript
// Playwright automatically waits, but explicit when needed
await page.waitForSelector('.result-card', { state: 'visible' });
await page.waitForLoadState('networkidle');
```

### 3. Handle Flakiness

```typescript
// Use soft assertions for non-critical checks
await expect.soft(page.locator('.badge')).toBeVisible();

// Retry flaky operations
await test.step('retry operation', async () => {
  for (let i = 0; i < 3; i++) {
    try {
      await page.click('button');
      break;
    } catch (e) {
      if (i === 2) throw e;
      await page.waitForTimeout(1000);
    }
  }
});
```

### 4. Clean Up State

```typescript
test.afterEach(async ({ page }) => {
  // Clear storage
  await page.evaluate(() => localStorage.clear());
  
  // Reset to initial state
  await page.goto('/');
});
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/ci.yml` defines:

1. **Test Job** - Unit tests across OS matrix
2. **E2E Job** - Playwright tests on Ubuntu
3. **Build Job** - Package application for distribution
4. **Accessibility Job** - axe-core compliance checks
5. **Security Job** - npm audit for vulnerabilities

### Artifacts

Uploaded on test failure:
- Screenshots
- Videos
- Trace files
- HTML reports

Access via GitHub Actions UI → Artifacts

## Configuration

### playwright.config.ts

Key settings:
```typescript
{
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:renderer',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
}
```

## Debugging

### 1. UI Mode

```bash
npm run test:e2e:ui
```

Features:
- Step through tests
- Time travel debugging
- Watch mode
- Pick locators

### 2. Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for stepping through code.

### 3. Trace Viewer

```bash
npx playwright show-trace trace.zip
```

View recorded traces with:
- Action timeline
- Network requests
- Console logs
- Screenshots

### 4. Screenshots

```typescript
// Manual screenshot
await page.screenshot({ path: 'debug.png' });

// Full page screenshot
await page.screenshot({ path: 'full.png', fullPage: true });
```

## Test Coverage

### Current Coverage

- ✅ Navigation between views
- ✅ Search functionality (metadata)
- ✅ Search functionality (torrents)
- ✅ Mode switching
- ✅ Settings persistence
- ✅ Error handling
- ✅ Accessibility (ARIA labels)
- ✅ Keyboard navigation
- ✅ Network error recovery

### TODO Coverage

- ⏳ Complete download flow (requires torrent setup)
- ⏳ Resume interrupted downloads
- ⏳ Library management (add/remove items)
- ⏳ Subtitle selection
- ⏳ Missing media relinking
- ⏳ Export/import library
- ⏳ Video playback
- ⏳ Offline mode comprehensive testing

## Performance Testing

### Lighthouse Integration

```bash
# Install lighthouse
npm install --save-dev @playwright/test lighthouse

# Run performance tests
npx playwright test --grep @performance
```

Example test:
```typescript
import { playAudit } from 'playwright-lighthouse';

test('should meet performance benchmarks', async ({ page }) => {
  await page.goto('/');
  
  await playAudit({
    page,
    thresholds: {
      performance: 85,
      accessibility: 90,
      'best-practices': 85,
      seo: 80,
    },
  });
});
```

## Continuous Improvement

### Adding New Tests

1. Identify user flow to test
2. Write test in appropriate spec file
3. Run locally: `npm run test:e2e`
4. Commit and push
5. Verify CI passes

### Updating Tests

When UI changes:
1. Update selectors if needed
2. Re-run tests locally
3. Update screenshots/traces if expected behavior changed
4. Document changes in commit message

## Common Issues

### Issue: Tests Timeout

**Cause**: Slow network, heavy computation
**Solution**:
```typescript
test.setTimeout(60000); // Increase timeout to 60s
```

### Issue: Element Not Found

**Cause**: Async rendering, dynamic content
**Solution**:
```typescript
await page.waitForSelector('.element', { timeout: 10000 });
```

### Issue: Flaky Tests

**Cause**: Race conditions, timing issues
**Solution**:
```typescript
// Use built-in waiting
await expect(element).toBeVisible();

// Add retries
test.describe.configure({ retries: 2 });
```

### Issue: CI Fails, Local Passes

**Cause**: Different environment (headless vs headed)
**Solution**:
```bash
# Run in headed mode
npx playwright test --headed

# Run in CI mode
CI=1 npx playwright test
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [CI/CD Integration](https://playwright.dev/docs/ci)
- [Debugging](https://playwright.dev/docs/debug)

## Maintenance

### Weekly
- Review failed test reports
- Update dependencies: `npm update`
- Check for Playwright updates

### Monthly
- Review test coverage
- Add tests for new features
- Refactor brittle tests
- Update documentation

### Quarterly
- Analyze test execution times
- Optimize slow tests
- Review CI/CD pipeline efficiency
- Update test strategy based on findings
