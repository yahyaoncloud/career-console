# P6 - UI System Design

## 1. Purpose
Define the UI system architecture using Shadcn UI and Tailwind CSS, establishing a consistent design language, component library, and styling approach for the entire application.

## 2. Architecture
The UI system uses **Shadcn UI** as the component foundation with **Tailwind CSS** for styling. This provides:
- **Accessible components** out of the box
- **Customizable design tokens** via CSS variables
- **Dark mode support** built-in
- **Type-safe components** with TypeScript
- **Tree-shakeable** imports for optimal bundle size

### Design Principles
- **Minimalist:** Clean, uncluttered interfaces
- **Professional:** Enterprise-grade aesthetics
- **Accessible:** WCAG AA compliant
- **Responsive:** Mobile-first design
- **Performant:** No unnecessary animations
- **Consistent:** Unified design language

### Color System
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### Typography Scale
```css
/* Base font size: 16px */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

text-xs: 0.75rem;   /* 12px */
text-sm: 0.875rem;  /* 14px */
text-base: 1rem;    /* 16px */
text-lg: 1.125rem;  /* 18px */
text-xl: 1.25rem;   /* 20px */
text-2xl: 1.5rem;   /* 24px */
text-3xl: 1.875rem; /* 30px */
text-4xl: 2.25rem;  /* 36px */
```

## 3. Folder Structure Impact
UI components live in `/app/components/ui/` for Shadcn primitives and `/app/components/shared/` for custom shared components. Global styles are in `/app/styles/index.css`.

## 4. Best Practices
- **Use Shadcn components:** Prefer Shadcn components over custom implementations
- **Tailwind for layout:** Use Tailwind utility classes for layout and spacing
- **CSS variables for theming:** Use CSS variables for colors and spacing
- **Responsive design:** Use mobile-first approach with Tailwind breakpoints
- **Accessibility first:** Ensure all components are keyboard accessible
- **Dark mode:** Test all components in both light and dark modes
- **Consistent spacing:** Use Tailwind spacing scale consistently

## 5. Anti-patterns
- **Inline styles:** Never use inline styles (style={})
- **Magic numbers:** Never use arbitrary pixel values
- **Duplicate components:** Never create duplicate UI components
- **Custom animations:** Avoid unnecessary animations
- **Hardcoded colors:** Never hardcode color values, use CSS variables
- **Ignoring accessibility:** Never skip ARIA labels or keyboard support

## 6. Examples
*Shadcn Component Usage:*
```typescript
// app/components/shared/ApplicationCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface ApplicationCardProps {
  application: Application
  className?: string
}

export function ApplicationCard({ application, className }: ApplicationCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{application.company}</CardTitle>
          <Badge variant={application.priority === 'HIGH' ? 'destructive' : 'secondary'}>
            {application.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{application.position}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{application.status}</Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(application.appliedDate).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
```

*Responsive Layout:*
```typescript
// app/routes/_admin.dashboard.tsx
export default function Dashboard() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cards */}
      </div>
    </div>
  )
}
```

*Dark Mode Toggle:*
```typescript
// app/components/shared/ThemeToggle.tsx
import { Button } from '~/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/hooks/use-theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
```

## 7. Migration Strategy
1. Install Shadcn UI and configure Tailwind CSS
2. Add CSS variables for design tokens
3. Install required Shadcn components (Button, Card, Input, etc.)
4. Migrate existing custom components to Shadcn equivalents
5. Update all inline styles to Tailwind classes
6. Implement dark mode support
7. Test accessibility with keyboard navigation

## 8. Acceptance Criteria
- [ ] All UI components use Shadcn UI or follow Shadcn patterns
- [ ] No inline styles exist in the codebase
- [ ] Dark mode works across all pages
- [ ] All components are keyboard accessible
- [ ] Design is responsive on mobile, tablet, and desktop
- [ ] Consistent spacing and typography throughout

## 9. Future Scalability
- **Design tokens:** Extract design tokens to separate file for easy theming
- **Component variants:** Add variant system for component customization
- **Icon library:** Standardize icon usage with Lucide React
- **Animation library:** Add Framer Motion for complex animations if needed
- **Storybook:** Add Storybook for component documentation
- **Theming:** Support multiple themes beyond light/dark
