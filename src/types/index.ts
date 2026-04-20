export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'sourcing'
  | 'quote_ready'
  | 'quote_accepted'
  | 'deposit_required'
  | 'deposit_paid'
  | 'sample_production'
  | 'sample_approval_pending'
  | 'sample_approved'
  | 'manufacturing'
  | 'quality_check'
  | 'packing'
  | 'preparing_to_ship'
  | 'in_transit'
  | 'delivered'
  | 'action_required'
  | 'cancelled';

export type UserRole = 'client' | 'admin';

export type ClientRole = 'owner' | 'manager' | 'viewer';

export type InviteStatus = 'pending' | 'active' | 'expired';

export type ActionType = 'info_needed' | 'sample_approval' | 'payment_required' | 'document_upload';

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: UserRole;
  client_role: ClientRole;
  organization_id: string;
  parent_user_id: string | null;
  invited_by: string | null;
  invite_status: InviteStatus;
  business_address: string;
  delivery_address: string;
  created_at: string;
}

export interface Order {
  id: string;
  client_id: string;
  order_number?: string;
  status: OrderStatus;
  product_type: string;
  product_description: string;
  quantity: number;
  target_price: number;
  target_delivery_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  // Quote fields
  quote_air_price_per_unit?: number | null;
  quote_air_lead_days?: number | null;
  quote_air_production_days?: number | null;
  quote_air_shipping_days?: number | null;
  quote_ocean_price_per_unit?: number | null;
  quote_ocean_lead_days?: number | null;
  quote_ocean_production_days?: number | null;
  quote_ocean_shipping_days?: number | null;
  quote_submitted_at?: string | null;
  selected_shipping?: 'air' | 'ocean' | null;
  selected_shipping_at?: string | null;
  // Deposit fields
  deposit_amount?: number | null;
  deposit_paid?: boolean;
  deposit_paid_at?: string | null;
  stripe_payment_intent_id?: string | null;
  // Cancellation fields
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  // Refund fields
  refund_amount?: number | null;
  refund_issued?: boolean;
  refund_issued_at?: string | null;
  refund_note?: string | null;
  // Prefixed product fields
  prefixed_product_id?: string | null;
  selected_size?: string | null;
}

export interface OrderUpdate {
  id: string;
  order_id: string;
  status: OrderStatus;
  message: string;
  created_by: string;
  created_at: string;
  requires_action: boolean;
  action_type?: ActionType;
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: UserRole;
  sender_name?: string;
  message: string;
  attachments: string[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  client_role: ClientRole;
  invite_status: InviteStatus;
  created_at: string;
}

export interface OrderSpecification {
  id: string;
  order_id: string;
  materials: string;
  colors: string[];
  logo_placement: string;
  packaging_requirements: string;
  certifications: string[];
  additional_specs: Record<string, string>;
}

export interface DeliveryAddress {
  id: string;
  organization_id: string;
  label: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'order_status' | 'new_message';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  order_id: string | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export interface PrefixedProductSize {
  size: string;
  price: number;
}

export interface PrefixedProduct {
  id: string;
  product_type: string;
  name: string;
  description: string;
  material: string;
  sizes: PrefixedProductSize[];
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  estimated_production_days: number | null;
  sku: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderShipment {
  id: string;
  order_id: string;
  delivery_address_id: string;
  quantity: number;
  notes: string;
  created_at: string;
  delivery_address?: DeliveryAddress;
}
