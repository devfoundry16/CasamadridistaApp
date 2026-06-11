import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/supabase";

export interface MemberRegistration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  fan_club_id: string | null;
  fan_club_name: string;
  madridista_card_number: string | null;
  signature_full_name: string;
  registration_pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  fanClubId?: string | null;
  fanClubName: string;
  madristaCardNumber?: string;
  signatureFullName: string;
}

class MemberRegistrationServiceClass {
  private readonly AUTH_TOKEN_KEY = "auth_token";

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get the current user's registration, or null if none exists yet.
   */
  async getRegistration(): Promise<MemberRegistration | null> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}member-registration`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(
        error.response?.data?.error || "Failed to load registration",
      );
    }
  }

  /**
   * Create or update the registration.
   * On success, the backend generates the Ficha adulto PDF and emails it.
   */
  async upsertRegistration(
    data: MemberRegistrationInput,
  ): Promise<MemberRegistration & { pdfGenerated: boolean }> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.put(
        `${API_BASE_URL}member-registration`,
        data,
        { headers },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to save registration",
      );
    }
  }

  /**
   * Re-generate and re-email the registration PDF for an existing registration.
   */
  async regeneratePdf(): Promise<{ success: boolean; pdfGenerated: boolean }> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_BASE_URL}member-registration/regenerate-pdf`,
        {},
        { headers },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || "Failed to regenerate PDF",
      );
    }
  }

  /**
   * Fetch (or lazily create) the current user's unique QR token.
   * Returns the raw token UUID to embed in the QR code.
   */
  async getQrToken(): Promise<string> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}member/qr-token`, {
        headers,
      });
      return response.data.token as string;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to load QR token");
    }
  }
}

const MemberRegistrationService = new MemberRegistrationServiceClass();
export default MemberRegistrationService;
