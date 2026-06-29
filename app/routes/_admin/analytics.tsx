import { ComingSoon } from '../../components/shared/ComingSoon';
import { PieChart } from 'lucide-react';

export default function AnalyticsRoute() {
  return (
    <ComingSoon
      title="Analytics & Reporting"
      description="Deep-dive into your application pipeline performance, offer rates, and hiring funnel metrics with rich charts and dashboards."
      icon={PieChart}
    />
  );
}
