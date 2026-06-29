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
import { uploadFile } from '../../lib/supabase';
import { useState } from 'react';

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
  
  const profile = await prisma.profile.findUnique({
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
    const existingSlug = await prisma.profile.findUnique({
      where: { slug: validated.slug }
    });
    
    if (existingSlug && existingSlug.userId !== user.id) {
      return { success: false, message: 'Slug is already taken by another author.' };
    }

    const updatedProfile = await prisma.profile.upsert({
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
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const bucket = 'career-assets';
      const folder = field === 'avatar' ? `authors/${user.id}` : 'covers';
      const explicitName = field === 'avatar' ? 'avatar.jpeg' : undefined;
      
      const { url } = await uploadFile(file, folder, bucket, explicitName);
      setValue(field, url, { shouldValidate: true, shouldDirty: true });
    } catch (err: any) {
      console.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

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
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground flex items-center gap-3">
            <UserCircle className="text-primary" size={24} />
            Author Profile
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-mono">
            Manage your public identity, bio, and portfolio preferences.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">Account ID</p>
          <p className="text-xs font-mono font-medium text-foreground bg-muted/50 px-2 py-1 rounded mt-1 border border-border/50">{user.id.slice(0, 8)}...</p>
        </div>
      </div>

      <Card className="p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Display Name *</label>
              <input
                {...register('displayName')}
                className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {errors.displayName && <p className="text-destructive text-xs mt-1">{errors.displayName.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Slug (URL) *</label>
              <input
                {...register('slug')}
                className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Biography</label>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder="A short bio about yourself..."
                className={`w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none ${errors.bio ? 'border-destructive' : ''}`}
              />
            </div>
          </div>
          </div>

          <div className="space-y-6 pt-2">
            <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 mb-4">Media & Links</h3>
            
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Website URL</label>
              <input
                {...register('website')}
                type="url"
                className="w-full px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="https://example.com"
              />
              {errors.website && <p className="text-destructive text-xs mt-1">{errors.website.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Avatar Image</label>
                <div className="flex gap-2">
                  <input
                    {...register('avatar')}
                    type="url"
                    className="flex-1 px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="URL or Upload ->"
                  />
                  <label className="flex items-center justify-center px-4 py-2 bg-muted/50 border border-border/50 rounded cursor-pointer hover:bg-muted transition-colors text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} disabled={isUploading} />
                  </label>
                </div>
                {errors.avatar && <p className="text-destructive text-xs mt-1">{errors.avatar.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    {...register('coverImage')}
                    className="flex-1 px-4 py-2.5 text-sm bg-background/50 border border-border/50 rounded hover:border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="URL or Upload ->"
                  />
                  <label className="flex items-center justify-center px-4 py-2 bg-muted/50 border border-border/50 rounded cursor-pointer hover:bg-muted transition-colors text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'coverImage')} disabled={isUploading} />
                  </label>
                </div>
                {errors.coverImage && <p className="text-xs text-destructive mt-1">{errors.coverImage.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 mb-4">Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded hover:bg-muted/30 border border-transparent hover:border-border/50 transition-colors">
                <input
                  type="checkbox"
                  {...register('analyticsEnabled')}
                  className="w-4 h-4 mt-1 border-border/50 text-primary focus:ring-primary bg-background rounded-sm"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Enable Analytics Tracking</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Collect anonymous page views for your author pages and blogs.</span>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded hover:bg-muted/30 border border-transparent hover:border-border/50 transition-colors">
                <input
                  type="checkbox"
                  {...register('guestbookEnabled')}
                  className="w-4 h-4 mt-1 border-border/50 text-primary focus:ring-primary bg-background rounded-sm"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Enable Public Guestbook</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Allow visitors to leave messages on your author profile.</span>
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
