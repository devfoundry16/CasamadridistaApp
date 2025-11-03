export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  key: string;
  images: {
    id: number;
    src: string;
    alt: string;
    date_created: Date;
    date_created_gmt: Date;
    date_modified: Date;
    date_modified_gmt: Date;
  }[];
  extensions: {
    subscriptions: {
      billing_period: string; // "year";
      billing_interval: number; //1;
      subscription_length: number; //0;
      trial_length: number; //0;
      trial_period: string; //"month";
      is_resubscribe: boolean; //false;
      switch_type: any; //null;
      synchronization: any; //null;
      sign_up_fees: string; //"0";
      sign_up_fees_tax: string; //"0";
    };
  };
  quantity_limits: { minimum: number; maximum: number; editable: boolean };
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_prefix: string;
  };
  variation: [
    {
      raw_attribute: string; // "attribute_pa_billing-period";
      attribute: string; //"Billing Period";
      value: string; //"Yearly";
    },
  ];
}
