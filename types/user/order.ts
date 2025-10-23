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
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation?: Array<{
      attribute: string;
      value: string;
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderParams {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  productId: number;
  variationId: number;
  quantity: number;
  billing: Omit<Address, "type">;
  shipping?: Partial<Address>;
  variation?: Array<{ attribute: string; value: string }>;
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
