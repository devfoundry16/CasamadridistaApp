export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed'
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