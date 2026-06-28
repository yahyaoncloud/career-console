# P19 - Migration Plan

## 1. Purpose
Define the detailed migration plan from the current Express/MongoDB architecture to the new React Router/PostgreSQL architecture, ensuring minimal downtime and data integrity.

## 2. Architecture Migration Overview
The migration involves:
- **Frontend:** React SPA → React Router Framework
- **Backend:** Express → React Router loaders/actions
- **Database:** MongoDB → PostgreSQL (Supabase)
- **Auth:** Custom JWT → Supabase Auth
- **Deployment:** Custom server → Vercel serverless

### Migration Phases
1. **Phase 1:** Infrastructure setup (Supabase, Vercel)
2. **Phase 2:** Database migration
3. **Phase 3:** Backend migration
4. **Phase 4:** Frontend migration
5. **Phase 5:** Testing and validation
6. **Phase 6:** Cutover and cleanup

## 3. Folder Structure Impact
New `/app/` structure created alongside existing `/src/` and `/server/`. Old structure removed after successful migration.

## 4. Best Practices
- **Incremental migration:** Migrate incrementally, not all at once
- **Parallel running:** Run old and new systems in parallel during migration
- **Data validation:** Validate data at each migration step
- **Rollback plan:** Have rollback plan for each phase
- **Zero downtime:** Aim for zero downtime cutover
- **Testing:** Test thoroughly before cutover
- **Monitoring:** Monitor closely during migration

## 5. Anti-patterns
- **Big bang:** Never do big bang migration
- **No testing:** Never migrate without testing
- **No backup:** Never migrate without backup
- **No rollback:** Never migrate without rollback plan
- **Skipping validation:** Never skip data validation
- **Rushing:** Never rush migration

## 6. Examples
*Phase 1: Infrastructure Setup*
```bash
# 1. Create Supabase project
# 2. Create Vercel project
# 3. Configure environment variables
# 4. Set up database connection pooling
# 5. Configure custom domain
```

*Phase 2: Database Migration*
```typescript
// scripts/migrate-mongodb-to-postgres.ts
import mongoose from 'mongoose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUsers() {
  const mongoUsers = await mongoose.model('User').find({})
  
  for (const mongoUser of mongoUsers) {
    await prisma.user.create({
      data: {
        id: mongoUser._id.toString(),
        email: mongoUser.email,
        name: mongoUser.name,
        role: mongoUser.role || 'USER',
        createdAt: mongoUser.createdAt,
        updatedAt: mongoUser.updatedAt
      }
    })
  }
}

async function migrateApplications() {
  const mongoApps = await mongoose.model('Application').find({})
  
  for (const mongoApp of mongoApps) {
    await prisma.application.create({
      data: {
        id: mongoApp._id.toString(),
        userId: mongoApp.userId,
        company: mongoApp.company,
        position: mongoApp.position,
        // ... map all fields
        createdAt: mongoApp.createdAt,
        updatedAt: mongoApp.updatedAt
      }
    })
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI!)
  await migrateUsers()
  await migrateApplications()
  console.log('Migration complete')
}

main()
```

*Phase 3: Backend Migration*
```typescript
// Migrate Express routes to React Router actions
// Old: server/routes/applications.ts
app.get('/api/applications', async (req, res) => {
  const applications = await Application.find({ userId: req.user.id })
  res.json(applications)
})

// New: app/routes/_admin.applications.ts
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const applications = await prisma.application.findMany({
    where: { userId: user.id, deletedAt: null }
  })
  return json({ success: true, data: applications })
}
```

*Phase 4: Frontend Migration*
```typescript
// Old: useEffect data fetching
useEffect(() => {
  fetch('/api/applications').then(res => res.json()).then(setApplications)
}, [])

// New: loader data
export async function loader({ request }: LoaderFunctionArgs) {
  const applications = await prisma.application.findMany(...)
  return json({ applications })
}

export default function Applications() {
  const { applications } = useLoaderData<typeof loader>()
  return <ApplicationList applications={applications} />
}
```

*Phase 5: Validation Script*
```typescript
// scripts/validate-migration.ts
async function validateMigration() {
  const mongoCount = await mongoose.model('Application').countDocuments()
  const pgCount = await prisma.application.count()
  
  if (mongoCount !== pgCount) {
    throw new Error(`Count mismatch: MongoDB ${mongoCount}, PostgreSQL ${pgCount}`)
  }
  
  // Sample validation
  const mongoSample = await mongoose.model('Application').findOne()
  const pgSample = await prisma.application.findUnique({
    where: { id: mongoSample._id.toString() }
  })
  
  if (!pgSample) {
    throw new Error('Sample record not found in PostgreSQL')
  }
  
  console.log('Validation passed')
}
```

## 7. Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)
- Create Supabase project
- Create Vercel project
- Configure environment variables
- Set up database connection pooling
- Configure custom domain
- Set up monitoring

### Phase 2: Database Migration (Week 2)
- Create Prisma schema
- Run initial migration
- Write migration script
- Test migration on staging
- Validate data integrity
- Backup MongoDB data

### Phase 3: Backend Migration (Week 3-4)
- Set up React Router project structure
- Migrate authentication to Supabase
- Migrate Express routes to loaders/actions
- Add Zod validation
- Add error handling
- Add logging

### Phase 4: Frontend Migration (Week 5-6)
- Set up Shadcn UI
- Migrate components to new structure
- Replace useEffect with loaders
- Implement form system
- Add state management
- Test all user flows

### Phase 5: Testing (Week 7)
- Run comprehensive tests
- Perform load testing
- Security audit
- Performance testing
- User acceptance testing
- Fix issues

### Phase 6: Cutover (Week 8)
- Final data sync
- Deploy to production
- Monitor closely
- Validate production
- Decommission old system
- Update documentation

## 8. Acceptance Criteria
- [ ] All data migrated without loss
- [ ] All features working in new system
- [ ] Performance meets or exceeds old system
- [ ] Security audit passed
- [ ] Tests passing at 80%+ coverage
- [ ] Zero downtime during cutover
- [ ] Documentation updated
- [ ] Team trained on new system

## 9. Rollback Plan
- **Phase 1-2:** Revert infrastructure changes
- **Phase 3:** Keep Express running, revert loader/action changes
- **Phase 4:** Keep old frontend, revert component changes
- **Phase 5:** No rollback needed
- **Phase 6:** Switch DNS back to old system, restore from backup

## 10. Future Scalability
- **Multi-region:** Add multi-region deployment
- **Blue-green:** Implement blue-green deployments
- **Canary:** Add canary deployment capability
- **Automated migration:** Automate future migrations
