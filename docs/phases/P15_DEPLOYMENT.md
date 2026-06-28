# P15 - Deployment

## 1. Purpose
Define the deployment strategy for the SaaS platform, ensuring reliable, automated, and scalable deployments to production environments.

## 2. Architecture
The application is deployed as a **serverless application** on **Vercel** with:
- **Edge Network:** Global edge deployment via Vercel Edge Network
- **Serverless Functions:** React Router loaders/actions as serverless functions
- **Database:** Supabase PostgreSQL with connection pooling
- **CDN:** Static assets served via Vercel CDN
- **Environment Management:** Separate environments for dev, staging, production

### Deployment Pipeline
```
Git Push → CI/CD → Build → Test → Deploy to Preview → Deploy to Production
```

### Environments
- **Development:** Local development with hot reload
- **Preview:** Automatic preview deployments on PR
- **Staging:** Pre-production testing environment
- **Production:** Live production environment

## 3. Folder Structure Impact
Deployment configuration in `vercel.json`, `.env.example`, and `package.json` scripts. Docker configuration in `Dockerfile` (optional).

## 4. Best Practices
- **Automated deployments:** All deployments via CI/CD
- **Environment variables:** All secrets in environment variables
- **Preview deployments:** Preview deployments for every PR
- **Zero-downtime:** Zero-downtime deployments
- **Rollback capability:** Ability to rollback quickly
- **Health checks:** Health checks for monitoring
- **Database migrations:** Automated database migrations
- **Asset optimization:** Optimized assets in production

## 5. Anti-patterns
- **Manual deployments:** Never deploy manually
- **Hardcoded secrets:** Never hardcode secrets in code
- **Skipping tests:** Never skip tests in deployment
- **Direct production:** Never deploy directly to production
- **No rollback:** Never deploy without rollback capability
- **Missing monitoring:** Never deploy without monitoring

## 6. Examples
*Vercel Configuration:*
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": {
      "description": "PostgreSQL connection string",
      "value": "@database-url"
    },
    "SUPABASE_URL": {
      "description": "Supabase project URL",
      "value": "@supabase-url"
    },
    "SUPABASE_ANON_KEY": {
      "description": "Supabase anonymous key",
      "value": "@supabase-anon-key"
    }
  },
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

*Environment Variables:*
```bash
# .env.example
DATABASE_URL="postgresql://user:password@host:5432/db"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
GEMINI_API_KEY="AIza..."
SESSION_SECRET="your-32-character-secret-key"
NODE_ENV="production"
```

*Database Migration Script:*
```bash
# package.json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
}
```

*Health Check Endpoint:*
```typescript
// app/routes/api.health.ts
export async function loader() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy'
      }
    })
  } catch (error) {
    return json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      },
      { status: 503 }
    )
  }
}
```

*Docker Configuration (Optional):*
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## 7. Migration Strategy
1. Set up Vercel project
2. Configure environment variables
3. Set up Supabase project
4. Configure database connection pooling
5. Set up preview deployments
6. Configure custom domain
7. Set up monitoring and alerting
8. Test deployment pipeline

## 8. Acceptance Criteria
- [ ] Application deploys via CI/CD
- [ ] Preview deployments on every PR
- [ ] Zero-downtime deployments
- [ ] Rollback capability within 5 minutes
- [ ] Health check endpoint configured
- [ ] Database migrations automated
- [ ] Environment variables secured
- [ ] Monitoring and alerting configured

## 9. Future Scalability
- **Multi-region:** Deploy to multiple regions
- **Blue-green:** Implement blue-green deployments
- **Canary:** Implement canary deployments
- **Auto-scaling:** Configure auto-scaling policies
- **Disaster recovery:** Implement disaster recovery plan
- **Compliance:** Add compliance monitoring
