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
  photo?: string;
  subscription?: {
    type: string;
    plan: string;
    startDate: string;
    endDate: string;
  };
  role: string[];
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  fullName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
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
  status: 'pending' | 'completed' | 'cancelled';
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}