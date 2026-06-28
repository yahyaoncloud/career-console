# P7 - Component Guidelines

## 1. Purpose
Establish component development standards to ensure consistency, reusability, and maintainability across the entire React component library.

## 2. Architecture
Components follow **React 19** patterns with **TypeScript** for type safety. Components are organized by feature and shared globally when appropriate.

### Component Categories
1. **UI Primitives:** Shadcn components in `/app/components/ui/`
2. **Shared Components:** Reusable business components in `/app/components/shared/`
3. **Feature Components:** Route-specific components colocated with routes
4. **Layout Components:** Page layouts in route files

### Component Principles
- **Single Responsibility:** Each component does one thing well
- **Composition:** Build complex UIs from simple components
- **Reusability:** Design components to be reused in multiple contexts
- **Testability:** Components should be easy to test in isolation
- **Performance:** Optimize for render performance

## 3. Folder Structure Impact
- `/app/components/ui/`: Shadcn primitives (Button, Card, Input, etc.)
- `/app/components/shared/`: Shared business components (ApplicationCard, PortfolioCard, etc.)
- `/app/routes/*/`: Colocated route-specific components

## 4. Best Practices
- **Small components:** Keep components under 200 lines when possible
- **Typed props:** Always define TypeScript interfaces for props
- **Default props:** Use default values for optional props
- **Destructuring:** Destructure props at component top
- **Naming:** Use PascalCase for component names, camelCase for props
- **Composition:** Use children prop for flexible composition
- **Accessibility:** Include ARIA labels and keyboard support
- **Error boundaries:** Wrap components in error boundaries where appropriate

## 5. Anti-patterns
- **God components:** Avoid components that do too many things
- **Prop drilling:** Avoid passing props through many levels
- **Any types:** Never use `any` in component props
- **Inline functions:** Avoid inline function definitions in render
- **Unnecessary state:** Keep state at the lowest appropriate level
- **Duplicate logic:** Extract shared logic to custom hooks

## 6. Examples
*Well-Structured Component:*
```typescript
// app/components/shared/ApplicationCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { Application } from '~/modules/applications/types'

interface ApplicationCardProps {
  application: Application
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}

export function ApplicationCard({ 
  application, 
  onEdit, 
  onDelete,
  className 
}: ApplicationCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{application.company}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {application.position}
            </p>
          </div>
          <Badge variant={getStatusVariant(application.status)}>
            {application.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{application.priority}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(application.appliedDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(application.id)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(application.id)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'OFFER': return 'default'
    case 'REJECTED': return 'destructive'
    default: return 'secondary'
  }
}
```

*Composition Pattern:*
```typescript
// app/components/shared/DataTable.tsx
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr 
            key={i} 
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
          >
            {columns.map(col => (
              <td key={col.key}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

*Error Boundary:*
```typescript
// app/components/shared/ErrorBoundary.tsx
import { ComponentProps, useState } from 'react'

interface ErrorBoundaryProps extends ComponentProps<'div'> {
  fallback?: React.ReactNode
}

export function ErrorBoundary({ children, fallback, ...props }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return fallback || (
      <div {...props} className="p-4 border border-destructive rounded-lg">
        <p className="text-destructive">Something went wrong</p>
      </div>
    )
  }

  return (
    <div {...props} onError={() => setHasError(true)}>
      {children}
    </div>
  )
}
```

## 7. Migration Strategy
1. Audit existing components in `/src/components/`
2. Identify components that can be replaced with Shadcn equivalents
3. Extract reusable patterns into shared components
4. Add TypeScript types to all component props
5. Remove inline styles and replace with Tailwind
6. Test components in isolation
7. Move components to appropriate folders

## 8. Acceptance Criteria
- [ ] All components have TypeScript prop interfaces
- [ ] No component exceeds 300 lines without justification
- [ ] All components use Shadcn UI primitives where applicable
- [ ] All components are keyboard accessible
- [ ] No inline styles exist in components
- [ ] Components are organized by feature or shared appropriately

## 9. Future Scalability
- **Component library:** Extract shared components to separate package
- **Storybook:** Add Storybook for component documentation
- **Design system:** Formalize design system with documentation
- **Component variants:** Add variant system for customization
- **Performance monitoring:** Add component render profiling
- **A/B testing:** Support for component A/B testing
