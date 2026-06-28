# P14 - Testing

## 1. Purpose
Define the testing strategy for the SaaS platform, ensuring comprehensive test coverage, reliable automated testing, and confidence in deployments.

## 2. Architecture
Testing is implemented at multiple levels:
- **Unit Tests:** Vitest for unit testing utilities and components
- **Integration Tests:** Vitest for testing loaders and actions
- **E2E Tests:** Playwright for end-to-end user flows
- **Component Tests:** Vitest + Testing Library for component testing
- **Type Tests:** TypeScript for type safety validation

### Test Pyramid
```
        E2E Tests (Playwright)
       /                     \
    Integration Tests (Vitest)
   /                           \
Unit Tests (Vitest)    Component Tests (Vitest)
```

### Coverage Targets
- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All critical paths
- **E2E Tests:** All user-facing features
- **Component Tests:** All shared components

## 3. Folder Structure Impact
Tests colocated with source files using `.test.ts` suffix. E2E tests in `/tests/e2e/`. Test utilities in `/tests/utils/`.

## 4. Best Practices
- **Test isolation:** Each test should be independent
- **Descriptive tests:** Test names should describe what they test
- **AAA pattern:** Arrange, Act, Assert
- **Mock external dependencies:** Mock databases, APIs, etc.
- **Test happy path and errors:** Test both success and failure cases
- **Avoid implementation details:** Test behavior, not implementation
- **Keep tests fast:** Unit tests should run in milliseconds
- **Use fixtures:** Reuse test data with fixtures

## 5. Anti-patterns
- **Testing implementation:** Don't test implementation details
- **Brittle tests:** Don't write tests that break on minor changes
- **Slow tests:** Don't make unit tests slow
- **No assertions:** Don't write tests without assertions
- **Test duplication:** Don't duplicate test logic
- **Skipping tests:** Don't skip tests without fixing them
- **Testing third-party code:** Don't test library code

## 6. Examples
*Unit Test:*
```typescript
// app/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  
  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
  
  it('should handle tailwind merge conflicts', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
```

*Component Test:*
```typescript
// app/components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
  
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

*Integration Test (Loader):*
```typescript
// app/routes/_admin.applications.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loader } from './applications'
import { prisma } from '~/lib/db.server'

describe('Applications Loader', () => {
  beforeEach(async () => {
    // Reset database
    await prisma.application.deleteMany()
  })
  
  it('should load applications for authenticated user', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' }
    })
    
    await prisma.application.createMany({
      data: [
        { userId: user.id, company: 'Company A', position: 'Engineer', appliedDate: new Date() },
        { userId: user.id, company: 'Company B', position: 'Developer', appliedDate: new Date() }
      ]
    })
    
    const request = new Request('http://localhost:3000/admin/applications', {
      headers: { 'Cookie': `session=${user.id}` }
    })
    
    const response = await loader({ request })
    const data = await response.json()
    
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
  })
  
  it('should return 401 for unauthenticated user', async () => {
    const request = new Request('http://localhost:3000/admin/applications')
    
    await expect(loader({ request })).rejects.toThrow()
  })
})
```

*E2E Test (Playwright):*
```typescript
// tests/e2e/applications.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Applications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
  })
  
  test('should display applications list', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/applications')
    await expect(page.locator('h1')).toContainText('Applications')
  })
  
  test('should create new application', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/applications')
    await page.click('button:has-text("Create Application")')
    
    await page.fill('input[name="company"]', 'Test Company')
    await page.fill('input[name="position"]', 'Test Position')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Application created successfully')).toBeVisible()
  })
  
  test('should filter applications by status', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/applications')
    await page.selectOption('select[name="status"]', 'APPLIED')
    await page.click('button:has-text("Apply Filter")')
    
    await expect(page.locator('[data-status="APPLIED"]')).toBeVisible()
  })
})
```

*Test Fixture:*
```typescript
// tests/fixtures/application.ts
import { prisma } from '~/lib/db.server'

export async function createApplicationFixture(overrides = {}) {
  return prisma.application.create({
    data: {
      company: 'Test Company',
      position: 'Test Position',
      appliedDate: new Date(),
      status: 'APPLIED',
      priority: 'MEDIUM',
      ...overrides
    }
  })
}

export async function createUserFixture(overrides = {}) {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      ...overrides
    }
  })
}
```

## 7. Migration Strategy
1. Set up Vitest for unit and integration tests
2. Set up Playwright for E2E tests
3. Write tests for critical user flows
4. Write tests for shared components
5. Write tests for loaders and actions
6. Configure CI to run tests automatically
7. Set up coverage reporting
8. Add pre-commit hooks for tests

## 8. Acceptance Criteria
- [ ] Unit tests for all utilities
- [ ] Component tests for all shared components
- [ ] Integration tests for all loaders and actions
- [ ] E2E tests for all user-facing features
- [ ] 80%+ code coverage
- [ ] Tests run in CI on every PR
- [ ] Tests complete in under 5 minutes
- [ ] No flaky tests

## 9. Future Scalability
- **Visual regression:** Add visual regression testing
- **Performance testing:** Add performance regression testing
- **Load testing:** Add load testing for API endpoints
- **Contract testing:** Add contract testing for external APIs
- **Chaos testing:** Add chaos testing for resilience
- **Test analytics:** Add test analytics for insights
