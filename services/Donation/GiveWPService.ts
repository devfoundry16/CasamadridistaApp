import axios, { AxiosInstance } from "axios";
import UserService from "../UserService";
import { development } from "@/config/environment";

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
    const params = await this.getAuth();
    try {
      const response = await this.api.get(`/donors`);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getForms() {
    // const params = await this.getAuth();
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
      const response = await this.api.get(`/campaigns/list-table`);
      // Parse HTML strings to plain text
      const parsedItems = response.data.items.map((item: any) => ({
        ...item,
        title: this.stripHtml(item.title),
        goal: this.stripHtml(item.goal),
        donationsCount: this.stripHtml(item.donationsCount),
        revenue: this.stripHtml(item.revenue),
        status: this.stripHtml(item.status),
      }));
      return { ...response.data, items: parsedItems };
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
}

export const GiveWPService = new ApiService();
