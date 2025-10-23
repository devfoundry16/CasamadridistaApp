export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  password: string;
  age?: string;
  nationality?: string;
  placeOfResidence?: string;
  annualIncome?: string;
  url?: string;
  subscription?: {
    type: string;
    plan: string;
    startDate: string;
    endDate: string;
  };
  billing: Partial<Address>;
  shipping: Partial<Address>;
  role: string[];
}

export interface Address {
  type: "shipping" | "billing";
  company: string;
  email: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  phone?: string;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "paypal";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  email?: string;
}

export interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: "pending" | "completed" | "cancelled";
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}
