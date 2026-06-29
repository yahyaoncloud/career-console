import { ComingSoon } from '../../../components/shared/ComingSoon';
import { ShoppingBag } from 'lucide-react';

export default function ProductsRoute() {
  return (
    <ComingSoon
      title="Product Catalog"
      description="Manage your digital or physical product listings, pricing tiers, and media assets in one place."
      icon={ShoppingBag}
    />
  );
}
