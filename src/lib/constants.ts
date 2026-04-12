import { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  sourcing: 'Sourcing Suppliers',
  sample_production: 'Sample Production',
  sample_approval_pending: 'Awaiting Sample Approval',
  sample_approved: 'Sample Approved',
  manufacturing: 'Manufacturing',
  quality_check: 'Quality Check',
  packing: 'Packing',
  preparing_to_ship: 'Preparing to Ship',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  action_required: 'Action Required',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-blue-100 text-blue-800',
  sourcing: 'bg-purple-100 text-purple-800',
  sample_production: 'bg-purple-100 text-purple-800',
  sample_approval_pending: 'bg-yellow-100 text-yellow-800',
  sample_approved: 'bg-green-100 text-green-800',
  manufacturing: 'bg-blue-100 text-blue-800',
  quality_check: 'bg-blue-100 text-blue-800',
  packing: 'bg-blue-100 text-blue-800',
  preparing_to_ship: 'bg-green-100 text-green-800',
  in_transit: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  action_required: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-700',
};

export const PRODUCT_TYPES = [
  'Apparel',
  'Drinkware',
  'Bags & Totes',
  'Tech Accessories',
  'Writing Instruments',
  'Headwear',
  'Home & Lifestyle',
  'Wellness',
  'Eco-Friendly',
  'Custom/Other',
];

export const ORDER_TIMELINE: OrderStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'sourcing',
  'sample_production',
  'sample_approval_pending',
  'sample_approved',
  'manufacturing',
  'quality_check',
  'packing',
  'preparing_to_ship',
  'in_transit',
  'delivered',
];
