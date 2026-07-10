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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          slug: string;
          name: string;
          subtitle: string;
          molecular_weight: string | null;
          default_size: string | null;
          is_active: boolean;
          is_featured: boolean;
          is_best_seller: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          slug: string;
          name: string;
          subtitle?: string;
          molecular_weight?: string | null;
          default_size?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          is_best_seller?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      inventory_locations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_locations"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          profile_id: string | null;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          profile_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          fulfillment_method: FulfillmentMethod;
          fulfillment_status?: FulfillmentStatus;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          store_location_id?: string | null;
          subtotal_cents?: number;
          total_cents?: number;
          research_disclaimer_accepted?: boolean;
          terms_accepted?: boolean;
          age_verified?: boolean;
          manual_review_flag?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_variant_id: string | null;
          product_name: string;
          sku: string | null;
          batch_number: string | null;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_variant_id?: string | null;
          product_name: string;
          sku?: string | null;
          batch_number?: string | null;
          quantity: number;
          unit_price_cents?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: PaymentMethod;
          status: PaymentStatus;
          amount_cents: number;
          transaction_reference: string | null;
          verified_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method: PaymentMethod;
          status: PaymentStatus;
          amount_cents?: number;
          transaction_reference?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      fulfillment_method: FulfillmentMethod;
      fulfillment_status: FulfillmentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
