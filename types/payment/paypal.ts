export interface PayPalPaymentSuccessData {
  paymentId: string;
  url: string;
  payerId?: string;
  paymentToken?: string;
}

export interface PayPalPaymentErrorData {
  error: string;
  message?: string;
  details?: any;
}

export interface PayPalWebViewProps {
  amount: string;
  currency?: string;
  description?: string;
  onSuccess: (data: PayPalPaymentSuccessData) => void;
  onCancel: () => void;
  onError: (error: PayPalPaymentErrorData) => void;
  sandbox?: boolean;
  clientId?: string;
}

export interface PayPalNavigationState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface PayPalMessageEvent {
  type: "PAYMENT_SUCCESS" | "PAYMENT_ERROR" | "PAYMENT_CANCELLED";
  payload?: any;
}

export interface PayPalCreatePaymentResponse {
  paymentId: string;
  approvalUrl: string;
}

export interface PayPalExecutePaymentRequest {
  paymentId: string;
  payerId: string;
}

export interface PayPalTransaction {
  amount: {
    total: string;
    currency: string;
  };
  description: string;
}

export interface PayPalPaymentData {
  intent: "sale" | "authorize" | "order";
  payer: {
    payment_method: "paypal";
  };
  transactions: PayPalTransaction[];
  redirect_urls: {
    return_url: string;
    cancel_url: string;
  };
}
