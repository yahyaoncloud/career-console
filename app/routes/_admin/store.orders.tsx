import { ComingSoon } from '../../../components/shared/ComingSoon';
import { ClipboardList } from 'lucide-react';

export default function OrdersRoute() {
  return (
    <ComingSoon
      title="Orders"
      description="Track customer orders, payment status, and fulfillment workflows with full visibility into your sales pipeline."
      icon={ClipboardList}
    />
  );
}
