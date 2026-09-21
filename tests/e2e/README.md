# E2E Tests with Playwright

End-to-end tests for LingoLive using Playwright. Tests cover critical user flows including authentication, learning, payments, live classes, and responsive design.

## Setup

### Prerequisites
- Node.js 16+ (Playwright will use system Chromium at `/opt/pw-browsers/chromium`)
- Development server running (`npm run dev`)

### Installation
Playwright is already installed as a dev dependency:
```bash
npm install
```

## Running Tests

### Local Development
Start the dev server in one terminal:
```bash
npm run dev
```

Then run tests in another terminal:
```bash
npm run test:e2e
```

### Debug Mode
Run tests with UI and trace:
```bash
npm run test:e2e:debug
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Single Test File
```bash
npx playwright test tests/e2e/auth.e2e.test.ts
```

### Single Test
```bash
npx playwright test -g "should display welcome screen"
```

## Test Files

| File | Tests | Coverage |
|---|---|---|
| `auth.e2e.test.ts` | 3 | App initialization, mobile responsiveness, navigation |
| `learning-flow.e2e.test.ts` | 3 | Dashboard rendering, language selection, console errors |
| `payment-flow.e2e.test.ts` | 5 | Pricing display, button interactions, error handling |
| `live-class.e2e.test.ts` | 5 | Interface rendering, WebRTC init, media permissions |
| `responsive-design.e2e.test.ts` | 5 | Mobile/tablet/desktop viewports, orientation, zoom |
| **Total** | **15** | **Core user flows** |

## Test Utilities

Common helpers in `fixtures.ts`:
- `waitForAppReady()` - Wait for app to be fully interactive
- `filterCriticalErrors()` - Filter out benign console errors
- `verifyPageInteractive()` - Verify page responsiveness
- `debugScreenshot()` - Capture screenshots (with DEBUG env var)

## CI/CD Integration

For GitHub Actions, consider these approaches:
1. **Build + Preview** - Build the app and serve with `npm run preview`
2. **Docker** - Run dev server in container for faster startup
3. **Artifact Caching** - Cache node_modules and build artifacts

Example GitHub Actions workflow:
```yaml
- name: Build
  run: npm run build

- name: Start preview server
  run: npm run preview &

- name: Run E2E tests
  run: npm run test:e2e
```

## Troubleshooting

### Tests timeout waiting for server
**Problem**: Tests fail with "Timed out waiting from config.webServer"
**Solution**: Ensure dev server is running: `npm run dev`

### Port 5173 already in use
**Problem**: "EADDRINUSE: address already in use :::5173"
**Solution**: Kill existing process or use different port

### Chromium not found
**Problem**: "Executable doesn't exist at /opt/pw-browsers/chromium"
**Solution**: This is environment-specific. On other systems, run:
```bash
playwright install chromium
```

### Media permission errors in tests
**Problem**: Tests fail due to camera/microphone access
**Solution**: Tests mock getUserMedia when permissions fail. This is expected behavior.

## Performance Notes

- **Test Suite Duration**: ~15-30 seconds (depending on app startup)
- **Dev Server Startup**: 30-60 seconds (includes Express + Vite initialization)
- **Single Test**: 2-5 seconds
- **Parallel Execution**: Tests run sequentially by default (1 worker). For parallel:
  ```bash
  npx playwright test --workers=4
  ```

## Best Practices

1. **Keep tests independent** - Each test should work in isolation
2. **Use meaningful selectors** - Prefer `role`, `label`, `testid` over class names
3. **Wait for readiness** - Use `waitForAppReady()` after navigation
4. **Filter benign errors** - Use `filterCriticalErrors()` to ignore ResizeObserver warnings
5. **Avoid hardcoded waits** - Use `waitFor()` instead of `sleep()`

## Extending Tests

To add new E2E tests:

1. Create a new file in `tests/e2e/`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/');
       await page.waitForLoadState('networkidle');
       // assertions...
     });
   });
   ```

2. Run your test:
   ```bash
   npx playwright test tests/e2e/your-feature.e2e.test.ts
   ```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
