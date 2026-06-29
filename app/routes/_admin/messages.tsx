import { ComingSoon } from '../../components/shared/ComingSoon';
import { MessageSquare } from 'lucide-react';

export default function MessagesRoute() {
  return (
    <ComingSoon
      title="Messages"
      description="Communicate with recruiters and collaborators directly from your console. Centralized inbox coming soon."
      icon={MessageSquare}
    />
  );
}
