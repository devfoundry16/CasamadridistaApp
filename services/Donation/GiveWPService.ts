import axios, { AxiosInstance } from "axios";
import UserService from "../UserService";
import { development } from "@/config/environment";
import { Donation } from "@/types/campaigns/campaigns";

const AUTH_USERNAME = development.AUTH_USERNAME;
const AUTH_PASSWORD = development.AUTH_PASSWORD;

class ApiService {
  private api: AxiosInstance;

  private stripHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&[^;]+;/g, (entity) => {
        const entities: { [key: string]: string } = {
          "&#36;": "$",
          "&": "&",
          "<": "<",
          ">": ">",
          '"': '"',
        };
        return entities[entity] || entity;
      })
      .trim();
  }

  constructor() {
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
    this.api = axios.create({
      baseURL: `${development.DEFAULT_BASE_URL}givewp/v3`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
    });

    // Add response interceptor for consistent error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        throw new Error(error.response?.data?.message || "An error occurred");
      }
    );
  }

  async getAuth() {
    return await UserService.getGiveWPAuth();
  }

  async getDonors() {
    try {
      const response = await this.api.get(`/donors`);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getForms() {
    try {
      const response = await this.api.get(`/forms`);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getForm(id: number) {
    try {
      const response = await this.api.get(`/form/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getCampaignsList() {
    try {
      const response = await this.api.get(`/campaigns`);
      // Parse HTML strings to plain text
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getCampaignById(id: number) {
    try {
      const response = await this.api.get(`/campaigns/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async giveDonation(donation_data: Donation) {
    try {
      const response = await this.api.post(`/donations`, donation_data);
      return response.data;
    } catch (error: any) {
      console.log(error.message);
      throw new Error(error || "An error occurred");
    }
  }
}

export const GiveWPService = new ApiService();
