# P18 - Versioning

## 1. Purpose
Define the versioning strategy for the SaaS platform, ensuring consistent release management, clear communication of changes, and backward compatibility considerations.

## 2. Architecture
Versioning follows **Semantic Versioning (SemVer)** with:
- **Major version (X.0.0):** Breaking changes
- **Minor version (0.X.0):** New features, backward compatible
- **Patch version (0.0.X):** Bug fixes, backward compatible

### Version Format
```
MAJOR.MINOR.PATCH (e.g., 1.2.3)
```

### Pre-release Identifiers
- **alpha:** Early development (1.0.0-alpha.1)
- **beta:** Feature complete, testing (1.0.0-beta.1)
- **rc:** Release candidate (1.0.0-rc.1)

## 3. Folder Structure Impact
Version tracking in `package.json`, `CHANGELOG.md`, and git tags. Migration scripts in `/prisma/migrations/`.

## 4. Best Practices
- **SemVer compliance:** Follow Semantic Versioning strictly
- **Changelog:** Maintain comprehensive CHANGELOG.md
- **Git tags:** Tag every release in git
- **Automated releases:** Automate release process
- **Breaking changes:** Document breaking changes clearly
- **Deprecation warnings:** Warn before breaking changes
- **Database migrations:** Version database migrations
- **API versioning:** Version API endpoints if needed

## 5. Anti-patterns
- **Skipping versions:** Never skip version numbers
- **Breaking changes in patches:** Never include breaking changes in patches
- **No changelog:** Never release without changelog
- **Manual releases:** Never release manually
- **Unclear changes:** Never release without clear change documentation
- **No deprecation:** Never break without deprecation

## 6. Examples
*CHANGELOG.md:*
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-28

### Added
- Initial release of Career Console
- Application tracking system
- Portfolio management
- AI-powered resume analysis
- Job scraping integration
- Telegram bot integration

### Changed
- Migrated from Express to React Router Framework
- Migrated from MongoDB to PostgreSQL
- Implemented RBAC authorization
- Added comprehensive testing suite

### Deprecated
- Legacy Express API endpoints (will be removed in 2.0.0)

### Fixed
- Fixed authentication session persistence
- Fixed database connection pooling

### Security
- Added rate limiting to all public endpoints
- Implemented CSRF protection
- Added security headers

## [0.1.0] - 2026-06-15

### Added
- Initial prototype
- Basic application tracking
- MongoDB integration
```

*package.json:*
```json
{
  "name": "career-console",
  "version": "1.0.0",
  "description": "Job application tracker and portfolio CMS",
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major"
  }
}
```

*Release Workflow (GitHub Actions):*
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx standard-version
      - name: Push changes
        run: |
          git push --follow-tags origin main
```

*Database Migration Versioning:*
```prisma
// prisma/migrations/20240628_initial/migration.sql
-- Initial migration
CREATE TABLE "User" (...);
CREATE TABLE "Application" (...);

// prisma/migrations/20240701_add_soft_delete/migration.sql
-- Add soft delete support
ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP;
```

*Breaking Change Documentation:*
```markdown
# BREAKING_CHANGES.md

## Version 2.0.0

### Removed
- Legacy Express API endpoints (`/api/*`)
- MongoDB support
- Custom JWT authentication

### Changed
- Authentication now requires Supabase Auth
- Database schema updated (run migrations)
- API response format changed (see API docs)

### Migration Guide
1. Update to Supabase Auth
2. Run database migrations: `npx prisma migrate deploy`
3. Update API calls to use new format
4. Remove custom JWT handling
```

## 7. Migration Strategy
1. Set up automated versioning with standard-version
2. Create CHANGELOG.md template
3. Configure git tagging strategy
4. Set up release automation
5. Document breaking changes
6. Version database migrations
7. Communicate releases to stakeholders

## 8. Acceptance Criteria
- [ ] All releases follow SemVer
- [ ] CHANGELOG.md maintained for all releases
- [ ] All releases tagged in git
- [ ] Breaking changes documented
- [ ] Database migrations versioned
- [ ] Release process automated
- [ ] Deprecation warnings added before breaking changes

## 9. Future Scalability
- **API versioning:** Add API versioning if needed
- **Feature flags:** Add feature flags for gradual rollouts
- **Canary releases:** Add canary release support
- **Rollback capability:** Ensure quick rollback capability
- **Release notes:** Generate release notes automatically
- **Communication:** Automate release communication
