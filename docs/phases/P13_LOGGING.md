# P13 - Logging

## 1. Purpose
Define the logging strategy for the SaaS platform, ensuring structured, searchable, and actionable logs for debugging, monitoring, and compliance.

## 2. Architecture
Logging is implemented as a structured JSON logging system with:
- **Structured logs:** JSON format for easy parsing and querying
- **Log levels:** DEBUG, INFO, WARN, ERROR, FATAL
- **Request tracing:** Request IDs for distributed tracing
- **Context enrichment:** Automatic context (userId, route, etc.)
- **Log aggregation:** Centralized log storage (Supabase or external service)
- **Audit logging:** Separate audit trail for compliance

### Log Structure
```typescript
{
  timestamp: string,
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
  message: string,
  requestId: string,
  userId?: string,
  tenantId?: string,
  route?: string,
  method?: string,
  duration?: number,
  error?: {
    name: string,
    message: string,
    stack?: string
  },
  context?: Record<string, any>
}
```

## 3. Folder Structure Impact
Logging utilities in `/app/lib/logger.server.ts`. Audit logging in database via Log model. Log configuration in `/app/lib/config/logger.ts`.

## 4. Best Practices
- **Structured logs:** Always use structured JSON logs
- **Log levels:** Use appropriate log levels
- **Request IDs:** Include request IDs in all logs
- **Context enrichment:** Add relevant context automatically
- **No console.log:** Never use console.log in production
- **Sensitive data:** Never log sensitive data (passwords, tokens)
- **Audit logging:** Log all security events separately
- **Log aggregation:** Use centralized log storage

## 5. Anti-patterns
- **Unstructured logs:** Never use plain text logs
- **Console.log:** Never use console.log in production
- **Missing context:** Never log without context
- **Sensitive data:** Never log passwords, tokens, or PII
- **Wrong levels:** Never use ERROR for INFO-level events
- **Silent failures:** Never swallow errors without logging
- **Excessive logging:** Don't log at DEBUG level in production

## 6. Examples
*Logger Implementation:*
```typescript
// app/lib/logger.server.ts
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId: string
  userId?: string
  tenantId?: string
  route?: string
  method?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  context?: Record<string, any>
}

class Logger {
  private requestId: string
  
  constructor(requestId?: string) {
    this.requestId = requestId || crypto.randomUUID()
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      ...context
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(entry, null, 2))
    }
    
    // In production, send to log aggregation service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(entry)
    }
  }
  
  debug(message: string, context?: Record<string, any>) {
    this.log('DEBUG', message, context)
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context)
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context)
  }
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('ERROR', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }
  
  fatal(message: string, error?: Error, context?: Record<string, any>) {
    this.log('FATAL', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }
  
  private async sendToLogService(entry: LogEntry) {
    // Send to Supabase Log table or external service
    try {
      await prisma.log.create({
        data: {
          userId: entry.userId,
          event: entry.message,
          status: entry.level as any,
          module: entry.route || 'UNKNOWN'
        }
      })
    } catch (err) {
      // Fail silently to avoid infinite loops
    }
  }
}

export function createLogger(requestId?: string) {
  return new Logger(requestId)
}
```

*Usage in Loader:*
```typescript
import { createLogger } from '~/lib/logger.server'
import { requireUser } from '~/lib/auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const requestId = crypto.randomUUID()
  const logger = createLogger(requestId)
  const startTime = Date.now()
  
  try {
    const user = await requireUser(request)
    logger.info('User authenticated', { userId: user.id })
    
    const applications = await prisma.application.findMany({
      where: { userId: user.id, deletedAt: null }
    })
    
    logger.info('Applications loaded', { 
      userId: user.id, 
      count: applications.length,
      duration: Date.now() - startTime 
    })
    
    return json({ applications })
  } catch (error) {
    logger.error('Failed to load applications', error as Error, { requestId })
    throw error
  }
}
```

*Audit Logging:*
```typescript
// Audit log for security events
export async function logAuditEvent({
  userId,
  event,
  status,
  module,
  details
}: {
  userId: string
  event: string
  status: 'SUCCESS' | 'FAILURE' | 'WARNING'
  module: string
  details?: Record<string, any>
}) {
  await prisma.log.create({
    data: {
      userId,
      event,
      status,
      module,
      // Store details as JSON if needed
    }
  })
}

// Usage
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request)
  
  try {
    // ... perform action
    
    await logAuditEvent({
      userId: user.id,
      event: 'Application created',
      status: 'SUCCESS',
      module: 'APPLICATIONS',
      details: { applicationId: application.id }
    })
    
    return json({ success: true })
  } catch (error) {
    await logAuditEvent({
      userId: user.id,
      event: 'Application creation failed',
      status: 'FAILURE',
      module: 'APPLICATIONS',
      details: { error: (error as Error).message }
    })
    throw error
  }
}
```

*Request Middleware for Logging:*
```typescript
// app/middleware.ts
import { createLogger } from '~/lib/logger.server'

export async function middleware({ request }: { request: Request }) {
  const requestId = crypto.randomUUID()
  const logger = createLogger(requestId)
  const startTime = Date.now()
  
  const url = new URL(request.url)
  
  logger.info('Request started', {
    requestId,
    method: request.method,
    route: url.pathname,
    userAgent: request.headers.get('user-agent')
  })
  
  const response = await next()
  
  logger.info('Request completed', {
    requestId,
    method: request.method,
    route: url.pathname,
    status: response.status,
    duration: Date.now() - startTime
  })
  
  response.headers.set('X-Request-ID', requestId)
  return response
}
```

## 7. Migration Strategy
1. Create logger utility with structured logging
2. Replace all console.log with logger calls
3. Add request ID generation and propagation
4. Implement audit logging for security events
5. Configure log aggregation (Supabase or external)
6. Add log retention policies
7. Set up log monitoring and alerting

## 8. Acceptance Criteria
- [ ] No console.log exists in production code
- [ ] All logs are structured JSON
- [ ] All logs include request ID
- [ ] All security events have audit logs
- [ ] Logs include relevant context (userId, route, etc.)
- [ ] Sensitive data never logged
- [ ] Log aggregation configured
- [ ] Log retention policies defined

## 9. Future Scalability
- **Log aggregation:** Integrate with external log service (Datadog, LogRocket)
- **Real-time monitoring:** Add real-time log monitoring
- **Alerting:** Add alerting for critical errors
- **Log analytics:** Add log analytics dashboard
- **Compliance:** Add compliance reporting from audit logs
- **Distributed tracing:** Add distributed tracing across services
