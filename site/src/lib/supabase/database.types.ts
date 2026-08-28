export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole =
  | "customer"
  | "read_only"
  | "fulfillment"
  | "admin"
  | "owner";
export type PaymentMethod = "cash" | "zelle" | "venmo";
export type PaymentStatus =
  | "pending_payment"
  | "payment_received"
  | "cash_due_at_pickup"
  | "paid"
  | "refunded"
  | "cancelled";
export type FulfillmentMethod = "shipping" | "local_pickup";
export type FulfillmentStatus =
  | "awaiting_scheduling"
  | "scheduled"
  | "order_accepted"
  | "ready_for_pickup"
  | "shipped"
  | "completed"
  | "no_show"
  | "cancelled";
export type InventoryMovementType =
  | "manual_adjustment"
  | "order_reservation"
  | "order_fulfillment"
  | "restock"
  | "return";
export type ProductPublicationStatus = "draft" | "published" | "archived";

type Table<Row extends object, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type Product = {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  molecular_weight: string | null;
  default_size: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  publication_status: ProductPublicationStatus;
  published_at: string | null;
  archived_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size_label: string;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
type ProductMedia = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};
type InventoryLocation = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type InventoryBatch = {
  id: string;
  product_variant_id: string;
  location_id: string;
  batch_number: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  low_stock_threshold: number;
  coa_url: string | null;
  coa_storage_path: string | null;
  expires_at: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
};
type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_admin: boolean;
  role: AppRole;
  created_at: string;
  updated_at: string;
};
type Address = {
  id: string;
  profile_id: string | null;
  label: string;
  full_name: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  created_at: string;
};
type Order = {
  id: string;
  order_number: string;
  profile_id: string | null;
  checkout_idempotency_key: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfillment_method: FulfillmentMethod;
  fulfillment_status: FulfillmentStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  store_location_id: string | null;
  subtotal_cents: number;
  total_cents: number;
  research_disclaimer_accepted: boolean;
  terms_accepted: boolean;
  age_verified: boolean;
  manual_review_flag: boolean;
  notes: string | null;
  reservation_expires_at: string | null;
  reservations_released_at: string | null;
  inventory_committed_at: string | null;
  created_at: string;
  updated_at: string;
};
type OrderItem = {
  id: string;
  order_id: string;
  product_variant_id: string | null;
  inventory_batch_id: string | null;
  product_name: string;
  sku: string | null;
  batch_number: string | null;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};
type Payment = {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount_cents: number;
  received_amount_cents: number | null;
  transaction_reference: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
};
type OrderStatusEvent = {
  id: string;
  order_id: string;
  payment_status: PaymentStatus | null;
  fulfillment_status: FulfillmentStatus | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};
type PickupAppointment = {
  id: string;
  order_id: string | null;
  profile_id: string | null;
  scheduled_for: string;
  booking_provider: string | null;
  booking_reference: string | null;
  location_id: string | null;
  status: string;
  created_at: string;
};
type ShippingFulfillment = {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  shipped_at: string | null;
  created_at: string;
};
type InventoryMovement = {
  id: string;
  inventory_batch_id: string;
  order_id: string | null;
  movement_type: InventoryMovementType;
  quantity_delta: number;
  on_hand_delta: number;
  reserved_delta: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
};
type AffiliateProfile = {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  commission_rate: number;
  created_at: string;
};
type PromoCode = {
  id: string;
  code: string;
  affiliate_profile_id: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  created_at: string;
};
type AffiliateReferral = {
  id: string;
  affiliate_profile_id: string;
  order_id: string | null;
  promo_code_id: string | null;
  sale_cents: number;
  commission_cents: number;
  payout_status: string;
  created_at: string;
};
type AffiliateInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  audience: string | null;
  message: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};
type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Json | null;
  after_data: Json | null;
  reason: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      product_categories: Table<ProductCategory, "name" | "slug">;
      products: Table<Product, "slug" | "name">;
      product_variants: Table<
        ProductVariant,
        "product_id" | "sku" | "size_label"
      >;
      product_media: Table<ProductMedia, "product_id" | "storage_path">;
      inventory_locations: Table<InventoryLocation, "name" | "slug">;
      inventory_batches: Table<
        InventoryBatch,
        "product_variant_id" | "location_id" | "batch_number"
      >;
      profiles: Table<Profile, "id">;
      addresses: Table<
        Address,
        "line1" | "city" | "region" | "postal_code"
      >;
      orders: Table<
        Order,
        | "order_number"
        | "customer_name"
        | "customer_email"
        | "fulfillment_method"
        | "payment_method"
      >;
      order_items: Table<OrderItem, "order_id" | "product_name" | "quantity">;
      payments: Table<Payment, "order_id" | "method" | "status">;
      order_status_events: Table<OrderStatusEvent, "order_id">;
      pickup_appointments: Table<PickupAppointment, "scheduled_for">;
      shipping_fulfillments: Table<ShippingFulfillment, "order_id">;
      inventory_movements: Table<
        InventoryMovement,
        "inventory_batch_id" | "movement_type" | "quantity_delta"
      >;
      affiliate_profiles: Table<AffiliateProfile, "name" | "email">;
      promo_codes: Table<PromoCode, "code">;
      affiliate_referrals: Table<AffiliateReferral, "affiliate_profile_id">;
      affiliate_inquiries: Table<AffiliateInquiry, "name" | "email">;
      audit_logs: Table<AuditLog, "action" | "entity_type">;
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_payment: {
        Args: {
          p_order_id: string;
          p_status: PaymentStatus;
          p_received_amount_cents: number;
          p_transaction_reference: string;
          p_customer_message: string;
          p_note: string;
        };
        Returns: undefined;
      };
      admin_update_fulfillment: {
        Args: {
          p_order_id: string;
          p_status: FulfillmentStatus;
          p_carrier: string;
          p_tracking_number: string;
          p_estimated_delivery_date: string | null;
          p_scheduled_for: string | null;
          p_location_id: string | null;
          p_customer_message: string;
          p_note: string;
        };
        Returns: undefined;
      };
      admin_set_product_publication: {
        Args: {
          p_product_id: string;
          p_status: ProductPublicationStatus;
        };
        Returns: undefined;
      };
      admin_save_inventory_batch: {
        Args: {
          p_batch_id: string | null;
          p_product_variant_id: string;
          p_location_id: string;
          p_batch_number: string;
          p_initial_quantity: number;
          p_low_stock_threshold: number;
          p_coa_url: string;
          p_coa_storage_path: string;
          p_expires_at: string | null;
        };
        Returns: string;
      };
      admin_adjust_inventory: {
        Args: {
          p_batch_id: string;
          p_quantity_delta: number;
          p_movement_type: InventoryMovementType;
          p_note: string;
        };
        Returns: number;
      };
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole;
      };
      has_any_role: {
        Args: { allowed_roles: AppRole[] };
        Returns: boolean;
      };
      get_catalog_availability: {
        Args: Record<PropertyKey, never>;
        Returns: {
          product_variant_id: string;
          in_stock: boolean;
        }[];
      };
      release_expired_reservations: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      submit_affiliate_inquiry: {
        Args: {
          p_name: string;
          p_email: string;
          p_phone: string;
          p_audience: string;
          p_message: string;
        };
        Returns: string;
      };
      submit_checkout: {
        Args: {
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone: string;
          p_store_location_id: string;
          p_idempotency_key: string;
          p_fulfillment_method: FulfillmentMethod;
          p_payment_method: PaymentMethod;
          p_notes: string;
          p_research_disclaimer_accepted: boolean;
          p_terms_accepted: boolean;
          p_age_verified: boolean;
          p_items: Json;
        };
        Returns: {
          order_id: string;
          order_number: string;
          total_cents: number;
        }[];
      };
    };
    Enums: {
      app_role: AppRole;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      fulfillment_method: FulfillmentMethod;
      fulfillment_status: FulfillmentStatus;
      inventory_movement_type: InventoryMovementType;
      product_publication_status: ProductPublicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
