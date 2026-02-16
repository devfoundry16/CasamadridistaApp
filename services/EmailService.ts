import axios from "axios";
import { API_BASE_URL } from "@/config/supabase";

export interface ContactEmailPayload {
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  comment: string;
}

export interface RoyalInvestorEmailPayload {
  fullName: string;
  age: string;
  phoneNumber: string;
  email: string;
  nationality: string;
  placeOfResidence: string;
  annualIncome: string;
}

export async function sendContactEmail(
  payload: ContactEmailPayload
): Promise<{ success: boolean; id?: string }> {
  const response = await axios.post<{ success: boolean; id?: string }>(
    `${API_BASE_URL}email/contact`,
    payload
  );
  return response.data;
}

export async function sendRoyalInvestorEmail(
  payload: RoyalInvestorEmailPayload
): Promise<{ success: boolean; id?: string }> {
  const response = await axios.post<{ success: boolean; id?: string }>(
    `${API_BASE_URL}email/royal-investor`,
    payload
  );
  return response.data;
}
