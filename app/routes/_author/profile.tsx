import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from 'react-router';
import { useLoaderData, useSubmit, useNavigation, useActionData } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { prisma } from '../../lib/db.server';
import { Heading } from '../../components/ui/Heading';
import { Card } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserCircle, Globe, Activity, Loader2 } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  bio: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  analyticsEnabled: z.boolean().or(z.string().transform(v => v === 'true')).default(false),
  guestbookEnabled: z.boolean().or(z.string().transform(v => v === 'true')).default(true)
});

type ProfileFormData = z.infer<typeof profileSchema>;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  const profile = await prisma.authorProfile.findUnique({
    where: { userId: user.id }
  });

  return { user, profile };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  
  const data = {
    displayName: formData.get('displayName') as string,
    slug: formData.get('slug') as string,
    bio: formData.get('bio') as string,
    website: formData.get('website') as string,
    avatar: formData.get('avatar') as string,
    coverImage: formData.get('coverImage') as string,
    analyticsEnabled: formData.get('analyticsEnabled') === 'true',
    guestbookEnabled: formData.get('guestbookEnabled') === 'true',
  };

  try {
    const validated = profileSchema.parse(data);
    
    // Check if slug is taken by another user
    const existingSlug = await prisma.authorProfile.findUnique({
      where: { slug: validated.slug }
    });
    
    if (existingSlug && existingSlug.userId !== user.id) {
      return { success: false, message: 'Slug is already taken by another author.' };
    }

    const updatedProfile = await prisma.authorProfile.upsert({
      where: { userId: user.id },
      update: {
        ...validated,
        website: validated.website || null,
        bio: validated.bio || null,
        avatar: validated.avatar || null,
        coverImage: validated.coverImage || null,
      },
      create: {
        userId: user.id,
        ...validated,
        website: validated.website || null,
        bio: validated.bio || null,
        avatar: validated.avatar || null,
        coverImage: validated.coverImage || null,
      }
    });

    return { success: true, profile: updatedProfile, message: 'Profile updated successfully' };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return { success: false, errors: err.flatten().fieldErrors, message: 'Validation failed' };
    }
    return { success: false, message: err.message || 'Failed to update profile' };
  }
}

export default function AuthorProfileRoute() {
  const { user, profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || user.name || '',
      slug: profile?.slug || user.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      avatar: profile?.avatar || user.image || '',
      coverImage: profile?.coverImage || '',
      analyticsEnabled: profile?.analyticsEnabled ?? true,
      guestbookEnabled: profile?.guestbookEnabled ?? true,
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    submit(formData, { method: 'post' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <Heading variant="h2" className="flex items-center space-x-2">
            <UserCircle className="text-primary" size={28} />
            <span>Author Profile</span>
          </Heading>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your public identity, bio, and portfolio preferences.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Account ID</p>
          <p className="text-sm font-mono font-bold text-foreground">{user.id.slice(0, 8)}...</p>
        </div>
      </div>
      
      {actionData?.message && (
        <div className={`p-4 rounded-md border text-sm font-bold flex items-center space-x-2 ${
          actionData.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {actionData.success ? <Save size={16} /> : <Activity size={16} />}
          <span>{actionData.message}</span>
        </div>
      )}

      <Card className="p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-bl-full -z-10" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">Display Name *</label>
              <input
                {...register('displayName')}
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
              />
              {errors.displayName && <p className="text-destructive text-xs mt-1">{errors.displayName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">Slug (URL) *</label>
              <input
                {...register('slug')}
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
              />
              {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-foreground">Biography</label>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder="A short bio about yourself..."
                className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${errors.bio ? 'border-destructive' : 'border-input hover:border-primary/50'}`}
              />
              {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">Website URL</label>
              <input
                {...register('website')}
                type="url"
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
              />
              {errors.website && <p className="text-destructive text-xs mt-1">{errors.website.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-mono text-muted-foreground mb-1">Avatar URL</label>
              <input
                {...register('avatar')}
                type="url"
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:ring-2 focus:ring-primary/40"
              />
              {errors.avatar && <p className="text-destructive text-xs mt-1">{errors.avatar.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-foreground">Cover Image URL</label>
              <input
                {...register('coverImage')}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.coverImage && <p className="text-xs text-destructive">{errors.coverImage.message}</p>}
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider font-mono">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('analyticsEnabled')}
                  className="w-4 h-4 mt-1 rounded border-input text-primary focus:ring-primary bg-background"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Enable Analytics Tracking</span>
                  <span className="text-xs text-muted-foreground">Collect anonymous page views for your author pages and blogs.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('guestbookEnabled')}
                  className="w-4 h-4 mt-1 rounded border-input text-primary focus:ring-primary bg-background"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Enable Public Guestbook</span>
                  <span className="text-xs text-muted-foreground">Allow visitors to leave messages on your author profile.</span>
                </div>
              </label>
            </div>
          </div>
          <div className="flex justify-end mt-8 border-t border-border pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-mono font-bold text-sm rounded hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
