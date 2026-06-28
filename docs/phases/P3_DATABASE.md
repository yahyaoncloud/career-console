# P3 - Database Design

## 1. Purpose
Define the database architecture, schema design, and data access patterns for the PostgreSQL database using Supabase and Prisma ORM. This ensures data integrity, performance, and scalability for the SaaS platform.

## 2. Architecture
The database layer uses **PostgreSQL** hosted on **Supabase** with **Prisma ORM** for type-safe database access. The design supports:
- **RBAC (Role-Based Access Control)** through user roles and permissions
- **Multi-tenancy readiness** with tenantId columns
- **Audit trails** through created_at, updated_at, created_by, updated_by
- **Soft delete** via deleted_at timestamps
- **Optimistic locking** via version columns where needed

### Core Tables
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(USER)
  authorStatus  AuthorStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  applications  Application[]
  portfolio     Portfolio[]
  guestbook     Guestbook[]
  logs          Log[]
  config        Config[]
  learningTopics LearningTopic[]
  profile       Profile?

  @@index([email])
  @@index([deletedAt])
  @@index([authorStatus])
}

model Application {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  company         String
  position        String
  location        String?
  salary          String?
  employmentType  String?
  appliedDate     DateTime
  deadline        DateTime?
  referral        String?
  recruiter       String?
  contact         String?
  website         String?
  priority        Priority  @default(MEDIUM)
  status          Status    @default(APPLIED)
  interviewDate   DateTime?
  notes           String?
  resumeUsed      String?
  coverLetter     String?
  tags            String[]
  version         Int       @default(1)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?

  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([deletedAt])
}

model Portfolio {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  title             String
  description       String
  architectureDiagram String?
  techStack         String[]
  githubLink        String?
  demoLink          String?
  caseStudy         String?
  category          String
  version           Int       @default(1)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  createdBy         String?
  updatedBy         String?

  @@index([userId])
  @@index([category])
  @@index([deletedAt])
}

model Guestbook {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  name      String
  message   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([userId])
  @@index([deletedAt])
}

model Log {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  event     String
  status    LogStatus
  module    String
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model Config {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  key       String   @unique
  value     Boolean
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@unique([userId, key])
}

model LearningTopic {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  topic       String
  description String
  action      String
  date        String
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([date])
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  displayName     String
  slug            String   @unique
  bio             String?
  avatar          String?
  coverImage      String?
  website         String?
  socialLinks     Json?
  theme           Json?
  customDomain    String?
  analyticsEnabled Boolean  @default(true)
  guestbookEnabled Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([userId])
}

enum Role {
  USER
  ADMIN
}

enum AuthorStatus {
  ACTIVE
  SUSPENDED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Status {
  WISHLIST
  APPLIED
  HR_SCREENING
  TECHNICAL
  OFFER
  REJECTED
}

enum LogStatus {
  SUCCESS
  WARNING
  ERROR
  INFO
}
```

## 3. Folder Structure Impact
Database schema lives in `/prisma/schema.prisma`. Migrations are stored in `/prisma/migrations/`. Seed scripts are in `/prisma/seed.ts`. Database utilities are in `/app/lib/db.server.ts`.

## 4. Best Practices
- **Always use Prisma Client:** Never write raw SQL queries unless absolutely necessary
- **Use transactions:** For multi-table operations, use `prisma.$transaction()`
- **Index strategically:** Add indexes on foreign keys, frequently queried columns, and soft delete columns
- **Soft delete patterns:** Always filter by `deletedAt IS NULL` in queries
- **Generated types:** Use `prisma generate` to create TypeScript types, never duplicate interfaces
- **Connection pooling:** Use Supabase connection pooler (Supavisor) for serverless environments

## 5. Anti-patterns
- **N+1 queries:** Avoid loops that trigger database queries. Use `include` or `select` for eager loading
- **Raw SQL:** Don't bypass Prisma unless for complex analytics queries
- **Missing indexes:** Don't forget to add indexes for foreign keys and query filters
- **Hardcoded IDs:** Never use hardcoded IDs in code, always use relations
- **Duplicate validation:** Don't validate data in code if the database constraint handles it

## 6. Examples
*Correct Query with Relations:*
```typescript
// Good: Eager loading with include
const applications = await prisma.application.findMany({
  where: { 
    userId: user.id,
    deletedAt: null
  },
  include: {
    user: {
      select: { name: true, email: true }
    }
  },
  orderBy: { appliedDate: 'desc' }
});
```

*Transaction Usage:*
```typescript
// Good: Transaction for atomic operations
await prisma.$transaction(async (tx) => {
  const application = await tx.application.create({
    data: { /* ... */ }
  });
  await tx.log.create({
    data: {
      userId: user.id,
      event: 'Application created',
      status: 'SUCCESS',
      module: 'APPLICATIONS'
    }
  });
  return application;
});
```

## 7. Migration Strategy
1. Export existing MongoDB data to JSON
2. Create Prisma schema matching current Mongoose models
3. Run `prisma migrate dev --name init` to create initial migration
4. Write migration script to transform and import MongoDB data
5. Validate data integrity
6. Switch application to use Prisma client
7. Remove MongoDB dependencies

## 8. Acceptance Criteria
- [ ] All tables have created_at, updated_at timestamps
- [ ] All tables support soft delete via deleted_at
- [ ] All foreign key relationships are properly indexed
- [ ] Prisma client is configured with connection pooling
- [ ] Migration path from MongoDB is documented and tested

## 9. Future Scalability
- **Multi-tenancy:** Add `tenantId` to all tables and update all queries to filter by tenant
- **Read replicas:** Configure read replicas for analytics queries
- **Partitioning:** Partition large tables (logs, applications) by date for performance
- **Row-level security:** Leverage Supabase RLS for additional data isolation
- **Database functions:** Move complex business logic to PostgreSQL functions for performance
