# P9 - Form System

## 1. Purpose
Define the form system architecture using React Hook Form and Zod, ensuring consistent validation, error handling, and user experience across all forms in the application.

## 2. Architecture
The form system uses **React Hook Form** for form state management integrated with **Zod** for validation. This provides:
- **Type-safe forms** with TypeScript inference from Zod schemas
- **Client-side validation** for immediate feedback
- **Server-side validation** for security
- **Optimized re-renders** for performance
- **Accessible forms** with proper ARIA attributes

### Form Components
1. **Form Wrapper:** React Router Form component for action integration
2. **Input Components:** Shadcn Input, Select, Textarea, etc.
3. **Validation:** Zod schemas for validation rules
4. **Error Display:** Inline error messages with clear feedback
5. **Loading States:** Disabled submit buttons during submission
6. **Success Feedback:** Toast notifications on success

## 3. Folder Structure Impact
- `/app/lib/schemas/`: Zod schemas for form validation
- `/app/components/shared/forms/`: Reusable form components
- Forms are colocated with their routes

## 4. Best Practices
- **Zod for validation:** Use Zod schemas as single source of truth
- **Type inference:** Infer TypeScript types from Zod schemas
- **Client + server validation:** Validate on both client and server
- **Clear error messages:** Provide helpful, specific error messages
- **Loading states:** Disable submit button during submission
- **Success feedback:** Show toast notifications on success
- **Form reset:** Reset form after successful submission
- **Unsaved changes:** Detect and warn about unsaved changes
- **Confirmation dialogs:** Add confirmation for destructive actions

## 5. Anti-patterns
- **Manual validation:** Never write custom validation logic
- **Duplicate schemas:** Never duplicate validation logic
- **Silent failures:** Never swallow form errors
- **Missing loading states:** Don't leave users wondering if form submitted
- **No validation:** Never submit forms without validation
- **Inline validation only:** Never rely solely on client-side validation

## 6. Examples
*Complete Form with Validation:*
```typescript
// app/lib/schemas/application.ts
import { z } from 'zod'

export const ApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100, 'Company too long'),
  position: z.string().min(1, 'Position is required').max(100, 'Position too long'),
  location: z.string().max(100).optional(),
  salary: z.string().max(50).optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['WISHLIST', 'APPLIED', 'HR_SCREENING', 'TECHNICAL', 'OFFER', 'REJECTED']).default('APPLIED'),
  appliedDate: z.string().datetime('Invalid date format'),
  deadline: z.string().datetime('Invalid date format').optional(),
  referral: z.string().max(100).optional(),
  recruiter: z.string().max(100).optional(),
  contact: z.string().max(100).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([])
})

export type ApplicationFormData = z.infer<typeof ApplicationSchema>
```

```typescript
// app/routes/_admin.applications.new.tsx
import { Form, useActionData, useNavigation } from '@react-router/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApplicationSchema, type ApplicationFormData } from '~/lib/schemas/application'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useToast } from '~/hooks/use-toast'

export default function NewApplication() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'APPLIED'
    }
  })
  
  // Show success toast
  if (actionData?.success) {
    toast({
      title: 'Success',
      description: actionData.message
    })
  }
  
  return (
    <Form method="post" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="company">Company</label>
          <Input
            id="company"
            {...register('company')}
            disabled={isSubmitting}
          />
          {errors.company && (
            <p className="text-destructive text-sm">{errors.company.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="position">Position</label>
          <Input
            id="position"
            {...register('position')}
            disabled={isSubmitting}
          />
          {errors.position && (
            <p className="text-destructive text-sm">{errors.position.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            {...register('status')}
            disabled={isSubmitting}
          >
            <option value="WISHLIST">Wishlist</option>
            <option value="APPLIED">Applied</option>
            <option value="HR_SCREENING">HR Screening</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {errors.status && (
            <p className="text-destructive text-sm">{errors.status.message}</p>
          )}
        </div>
        
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Creating...' : 'Create Application'}
        </Button>
      </div>
    </Form>
  )
}
```

*Server-Side Validation in Action:*
```typescript
import { z } from 'zod'
import { ApplicationSchema } from '~/lib/schemas/application'

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request)
  const formData = await request.formData()
  const rawData = Object.fromEntries(formData)
  
  // Server-side validation
  const result = ApplicationSchema.safeParse(rawData)
  
  if (!result.success) {
    return json({
      success: false,
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors
    }, { status: 422 })
  }
  
  const data = result.data
  
  try {
    const application = await prisma.application.create({
      data: {
        ...data,
        userId: user.id,
        appliedDate: new Date(data.appliedDate),
        deadline: data.deadline ? new Date(data.deadline) : null
      }
    })
    
    return json({
      success: true,
      message: 'Application created successfully',
      data: application
    })
  } catch (error) {
    return json({
      success: false,
      error: 'Failed to create application'
    }, { status: 500 })
  }
}
```

*Unsaved Changes Detection:*
```typescript
import { useEffect } from 'react'
import { useBlocker } from '@react-router/react'

export function useUnsavedChanges(isDirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  )
  
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, isDirty])
}
```

## 7. Migration Strategy
1. Create Zod schemas for all existing forms
2. Install React Hook Form and Zod resolver
3. Replace existing form implementations
4. Add server-side validation to all actions
5. Implement loading states and error handling
6. Add toast notifications for feedback
7. Add unsaved changes detection

## 8. Acceptance Criteria
- [ ] All forms use React Hook Form
- [ ] All forms validated with Zod schemas
- [ ] All forms have server-side validation
- [ ] All forms show loading states during submission
- [ ] All forms show success/error feedback
- [ ] All forms detect unsaved changes
- [ ] Destructive actions have confirmation dialogs

## 9. Future Scalability
- **Form wizards:** Add multi-step form support
- **Dynamic forms:** Add dynamic field generation from schemas
- **Form analytics:** Track form completion rates
- **Form persistence:** Save draft forms to local storage
- **Form versioning:** Track form schema versions
- **Form testing:** Add automated form testing
