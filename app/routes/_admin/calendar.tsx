import { ComingSoon } from '../../components/shared/ComingSoon';
import { Calendar } from 'lucide-react';

export default function CalendarRoute() {
  return (
    <ComingSoon
      title="Interview Calendar"
      description="Visualize your interview schedule, deadlines, and follow-up reminders in one unified calendar view."
      icon={Calendar}
    />
  );
}
