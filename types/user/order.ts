import { Address } from "./profile";
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  FAILED = "failed",
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: string;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  variationId: number;
  line_items: Array<{
    id?: number;
    name?: string;
    product_id: number;
    quantity: number;
    variation?: Array<{
      attribute: string;
      value: string;
    }>;
  }>;
  customer_id: number;
  billing: Partial<Address>;
  shipping?: Partial<Address>;
  variation?: Array<{ attribute: string; value: string }>;
  meta_data?: Array<{ key: string; value: string }>;
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  id: number;
  order_key: string;
  status: OrderStatus;
  customer_id: number;
  line_items: [
    {
      id: number;
      name: string;
      variation_id: number; //0;
      quantity: number; //2;
      tax_class: string; //"";
      subtotal: string; //"6.00";
      subtotal_tax: string; //"0.45";
      total: string; //"6.00";
      total_tax: string; //"0.45";
      taxes: [
        {
          id: number; //75;
          total: string; //"0.45";
          subtotal: string; //"0.45";
        },
      ];
      meta_data: [];
      sku: string; //"";
      price: number; //3;
    },
  ];
}
