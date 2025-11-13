export interface CampaignDetail {
  id: number;
  title: string;
  shortDescription: string;
  image: string;
  goal: 1000000;
  goalType: string;
  goalStats: {
    actual: number;
    actualFormatted: string;
    percentage: 0;
    goal: number;
    goalFormatted: string;
  };
  status: string;
}
export interface Donation {
  formId: number; //52470;
  firstName: string; //"Petrenko";
  lastName: string; //"Viacheslav";
  type: string; //"single";
  mode: string; //"test";
  amount: {
    amount: number; //"250.00";
    currency: string; //"USD";
    amountInMinorUnits: number; //"25000";
  };
  gatewayTransactionId: string;
  email: string; //"petrenkoviacheslav52@gmail.com";
  campaignId: number; //3;
  donorId: number; //1;
  gatewayId: string; //"stripe_payment_element";
}
