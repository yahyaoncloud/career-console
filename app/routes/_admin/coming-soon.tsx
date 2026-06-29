import { HardHat } from 'lucide-react';
import { Heading } from '../../components/ui/Heading';

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-200 dark:border-amber-500/20 shadow-sm">
        <HardHat size={32} className="text-amber-600 dark:text-amber-400" />
      </div>
      <Heading variant="h1" className="mb-2">Under Construction</Heading>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
        This feature is currently being built. Check back soon for updates!
      </p>
    </div>
  );
}
