export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'sourcing'
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

export type ActionType = 'info_needed' | 'sample_approval' | 'payment_required' | 'document_upload';

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: UserRole;
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
  message: string;
  attachments: string[];
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
