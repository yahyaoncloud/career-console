# P20 - Technical Debt

## 1. Purpose
Identify and track technical debt in the current codebase, establish a strategy for addressing debt during the migration, and prevent accumulation of new technical debt.

## 2. Architecture
Technical debt is tracked and managed through:
- **Debt Register:** Centralized tracking of all technical debt items
- **Prioritization:** Debt prioritized by impact and effort
- **Sprint Allocation:** Regular allocation of time for debt reduction
- **Prevention:** Practices to prevent new debt accumulation

## 3. Current Technical Debt

### High Priority (Address During Migration)
- **Express Server:** Custom Express server needs removal
- **MongoDB Dependencies:** Mongoose and MongoDB dependencies
- **Custom Auth:** Custom JWT authentication system
- **Large Files:** `App.tsx` (68KB) and `server.ts` (28KB) need splitting
- **Missing Tests:** No automated tests currently
- **No Type Safety:** Some `any` types and missing interfaces

### Medium Priority (Address Post-Migration)
- **Inline Styles:** Some inline styles in components
- **Console Logs:** Console.log statements in production code
- **Error Handling:** Inconsistent error handling
- **Validation:** Missing validation in some endpoints
- **Code Duplication:** Duplicated logic in some areas

### Low Priority (Address When Time Permits)
- **Documentation:** Missing code documentation
- **Component Organization:** Some components could be better organized
- **Performance:** Some performance optimizations possible
- **Accessibility:** Some accessibility improvements needed

## 4. Folder Structure Impact
Technical debt register in `/docs/technical-debt.md`. Debt tracking integrated into sprint planning.

## 5. Best Practices
- **Track debt:** Track all technical debt explicitly
- **Prioritize:** Prioritize debt by impact and effort
- **Allocate time:** Regularly allocate time for debt reduction
- **Prevent accumulation:** Prevent new debt through code review
- **Pay down incrementally:** Pay down debt incrementally
- **Communicate:** Communicate debt to stakeholders
- **Measure:** Measure debt over time

## 5. Anti-patterns
- **Ignoring debt:** Never ignore technical debt
- **Accumulating debt:** Never accumulate debt without plan
- **No tracking:** Never track debt informally
- **Big payoff:** Never try to pay all debt at once
- **Blaming:** Never blame individuals for debt
- **Skipping tests:** Never skip tests to go faster

## 6. Examples
*Technical Debt Register:*
```markdown
# Technical Debt Register

| ID | Description | Impact | Effort | Priority | Status | Assigned |
|----|-------------|--------|--------|----------|--------|----------|
| TD-001 | Remove Express server | High | High | P0 | In Progress | @dev |
| TD-002 | Migrate MongoDB to PostgreSQL | High | High | P0 | Pending | @dev |
| TD-003 | Split App.tsx | Medium | Medium | P1 | Pending | @dev |
| TD-004 | Add automated tests | High | High | P0 | Pending | @dev |
| TD-005 | Remove console.log statements | Low | Low | P2 | Pending | @dev |
| TD-006 | Add error boundaries | Medium | Low | P1 | Pending | @dev |
```

*Debt Prevention in Code Review:*
```markdown
## Code Review Checklist

- [ ] No new technical debt introduced
- [ ] Debt documented if unavoidable
- [ ] Tests added for new code
- [ ] Types are strict (no `any`)
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Code follows established patterns
```

*Debt Paydown Strategy:*
```typescript
// Example: Paying down debt by splitting large file
// Before: App.tsx (68KB)
// After: Split into multiple route modules

// app/routes/_admin.applications.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // Loader logic
}

export default function Applications() {
  // Component logic
}

// app/routes/_admin.portfolio.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  // Loader logic
}

export default function Portfolio() {
  // Component logic
}
```

## 7. Debt Reduction Strategy

### During Migration (Week 1-8)
- **Week 1-2:** Remove Express server dependencies
- **Week 3-4:** Remove MongoDB dependencies
- **Week 5-6:** Split large files, add types
- **Week 7-8:** Add automated tests, remove console.logs

### Post-Migration (Ongoing)
- **20% Rule:** Allocate 20% of each sprint to debt reduction
- **Debt Review:** Review debt register monthly
- **Prevention:** Enforce code review checklist
- **Measurement:** Track debt metrics over time

## 8. Acceptance Criteria
- [ ] All high-priority debt addressed during migration
- [ ] Debt register maintained and updated
- [ ] Regular time allocated for debt reduction
- [ ] Code review prevents new debt
- [ ] Debt metrics tracked over time
- [ ] Stakeholders informed of debt status

## 9. Debt Metrics
- **Debt Count:** Total number of debt items
- **Debt Age:** Average age of debt items
- **Debt Impact:** Total impact score of debt
- **Debt Reduction:** Debt items resolved per sprint
- **New Debt:** New debt items added per sprint

## 10. Future Scalability
- **Automated detection:** Add automated debt detection tools
- **Debt scoring:** Implement debt scoring algorithm
- **Debt forecasting:** Forecast debt accumulation
- **Debt budgeting:** Budget for debt reduction
- **Debt reporting:** Regular debt reporting to stakeholders
- **Debt prevention:** Enhanced prevention practices
