# P17 - Documentation

## 1. Purpose
Define the documentation strategy for the SaaS platform, ensuring comprehensive, maintainable, and accessible documentation for developers, users, and stakeholders.

## 2. Architecture
Documentation is organized into multiple categories:
- **Architecture Documentation:** ADRs, design decisions, system architecture
- **API Documentation:** OpenAPI specs, loader/action documentation
- **Developer Documentation:** Setup guides, coding standards, contribution guide
- **User Documentation:** User guides, feature documentation
- **Operations Documentation:** Deployment guides, runbooks, troubleshooting

### Documentation Structure
```
/docs
├── phases/          # Planning documents (P0-P20)
├── adr/             # Architecture Decision Records
├── api/             # API documentation
├── guides/          # Developer guides
├── operations/      # Operations documentation
└── user/            # User documentation
```

## 3. Folder Structure Impact
Documentation lives in `/docs/`. Code documentation via JSDoc comments. README.md in root for project overview.

## 4. Best Practices
- **Docs as code:** Treat documentation as code
- **Markdown format:** Use Markdown for all documentation
- **Diagrams:** Use Mermaid for diagrams
- **Version control:** Keep documentation in version control
- **Auto-generated:** Auto-generate API docs from code
- **Keep current:** Keep documentation up to date
- **Searchable:** Make documentation searchable
- **Accessible:** Use clear language and examples

## 5. Anti-patterns
- **Outdated docs:** Never let documentation become outdated
- **Separate repo:** Never keep docs in separate repo
- **No examples:** Never document without examples
- **Jargon:** Never use unnecessary jargon
- **Assumptions:** Never assume reader knowledge
- **Missing context:** Never document without context

## 6. Examples
*Architecture Decision Record (ADR):*
```markdown
# ADR-001: Adopt React Router Framework

## Status
Accepted

## Context
The current Express + React SPA architecture has several limitations:
- Network waterfall between client and API
- Complex state management
- Manual data fetching
- Poor SEO

## Decision
Adopt React Router Framework (v7) as the primary framework.
- Use loaders for server-side data fetching
- Use actions for server-side mutations
- Leverage SSR for performance and SEO
- Eliminate separate REST API layer

## Consequences
### Positive
- Improved performance via SSR
- Type-safe data fetching
- Eliminated network waterfall
- Better SEO

### Negative
- Learning curve for team
- Migration effort
- Framework lock-in

## Alternatives Considered
- Next.js (rejected: too opinionated)
- Remix (rejected: being merged into React Router)
- Keep Express (rejected: performance limitations)
```

*API Documentation:*
```markdown
# Applications API

## GET /admin/applications

List all applications for the authenticated user.

### Query Parameters
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

### Example
\`\`\`typescript
const response = await fetch('/admin/applications?status=APPLIED&page=1')
const data = await response.json()
\`\`\`
```

*Developer Guide:*
```markdown
# Getting Started

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Supabase account

## Setup

1. Clone the repository
\`\`\`bash
git clone https://github.com/yahyaoncloud/career-console
cd career-console
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Configure environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your values
\`\`\`

4. Set up database
\`\`\`bash
npx prisma migrate dev
npx prisma db seed
\`\`\`

5. Start development server
\`\`\`bash
npm run dev
\`\`\`

## Project Structure
See [P2_FOLDER_STRUCTURE.md](./phases/P2_FOLDER_STRUCTURE.md) for detailed structure.
```

*Code Documentation:*
```typescript
/**
 * Validates and creates a new application
 * 
 * @param data - Application data to create
 * @param userId - ID of the user creating the application
 * @returns Created application record
 * @throws ValidationError if validation fails
 * @throws DatabaseError if database operation fails
 * 
 * @example
 * ```typescript
 * const application = await createApplication({
 *   company: 'Google',
 *   position: 'Engineer',
 *   appliedDate: new Date()
 * }, userId)
 * ```
 */
export async function createApplication(
  data: CreateApplicationInput,
  userId: string
): Promise<Application> {
  // Implementation
}
```

## 7. Migration Strategy
1. Create documentation structure
2. Write ADRs for major decisions
3. Document API endpoints
4. Write developer guides
5. Add code documentation
6. Set up documentation site (optional)
7. Integrate documentation generation into CI

## 8. Acceptance Criteria
- [ ] All major decisions have ADRs
- [ ] API documentation complete
- [ ] Developer setup guide exists
- [ ] Code documentation on public APIs
- [ ] README.md is comprehensive
- [ ] Documentation is kept in version control
- [ ] Documentation is reviewed with code changes

## 9. Future Scalability
- **Documentation site:** Set up dedicated documentation site (Docusaurus)
- **Interactive docs:** Add interactive API documentation
- **Video tutorials:** Add video tutorials for complex topics
- **Auto-generation:** Auto-generate API docs from code
- **Translation:** Add multi-language support
- **Community docs:** Enable community contributions
