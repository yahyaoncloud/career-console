import { ComingSoon } from '../../../components/shared/ComingSoon';
import { Package } from 'lucide-react';

export default function InventoryRoute() {
  return (
    <ComingSoon
      title="Inventory Management"
      description="Monitor stock levels, set reorder thresholds, and manage variants across your entire product catalog."
      icon={Package}
    />
  );
}
