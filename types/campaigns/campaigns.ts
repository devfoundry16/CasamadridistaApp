export interface Campaigns {
  id: number;
  title: string;
  goal: string;
  donationsCount: string;
  revenue: string;
  status: string;
  titleRaw: string;
}

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
