// Supabase User structure
export interface User {
  id: string;
  email: string;
  profile: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    stripe_customer_id?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface Address {
  company?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  phone?: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "paypal";
  number?: string;
  cardHolder?: string;
  expiryDate?: string;
  email?: string;
  cvc?: string;
  exp_month?: number;
  exp_year?: number;
  stripe?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
