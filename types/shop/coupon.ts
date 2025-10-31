export interface Coupon {
  id: number; // Unique identifier (read-only)
  code: string; // Coupon code (mandatory)
  amount: string; // Numeric discount amount (even for percentage)
  date_created?: string; // Coupon creation date (site timezone)
  date_created_gmt?: string; // Coupon creation date (GMT)
  date_modified?: string; // Last modified date (site timezone)
  date_modified_gmt?: string; // Last modified date (GMT)
  discount_type?: "percent" | "fixed_cart" | "fixed_product"; // Type of discount
  description?: string; // Coupon description
  date_expires?: string; // Expiration date (site timezone)
  date_expires_gmt?: string; // Expiration date (GMT)
  usage_count?: number; // Number of times used (read-only)
  individual_use?: boolean; // If true, cannot be used with other coupons
  product_ids?: number[]; // Product IDs the coupon applies to
  excluded_product_ids?: number[]; // Product IDs the coupon excludes
  usage_limit?: number; // Total usage limit
  usage_limit_per_user?: number; // Per-user usage limit
  limit_usage_to_x_items?: number; // Max number of items coupon applies to
  free_shipping?: boolean; // Enables free shipping
  product_categories?: number[]; // Category IDs the coupon applies to
  excluded_product_categories?: number[]; // Category IDs excluded
  exclude_sale_items?: boolean; // Exclude items on sale
  minimum_amount?: string; // Minimum order amount
  maximum_amount?: string; // Maximum order amount
  email_restrictions?: string[]; // Emails allowed to use coupon
  used_by?: (number | string)[]; // User IDs or guest emails (read-only)
  meta_data?: MetaData[]; // Custom meta data
}

export interface MetaData {
  id?: number;
  key: string;
  value: any;
}
