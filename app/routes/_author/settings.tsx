import { type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { requireUser } from '../../lib/auth.server';
import { Heading } from '../../components/ui/Heading';
import { Card } from '../../components/ui/Card';
import { Settings } from 'lucide-react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return { user };
}

export default function AuthorSettingsRoute() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-2">
        <Settings className="text-primary" size={28} />
        <Heading variant="h2">Account Settings</Heading>
      </div>
      
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Security</h3>
        <p className="text-sm text-muted-foreground mb-4">Email: <span className="font-mono text-foreground">{user.email}</span></p>
        <p className="text-sm border-t border-border pt-4">More account settings and 2FA configuration coming soon...</p>
      </Card>
    </div>
  );
}
