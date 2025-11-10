import axios, { AxiosInstance } from "axios";
import UserService from "../UserService";
import { development } from "@/config/environment";

const AUTH_USERNAME = development.AUTH_USERNAME;
const AUTH_PASSWORD = development.AUTH_PASSWORD;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
    this.api = axios.create({
      baseURL: "https://casamadridista.com/json/givewp/v3",
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
}

export const GiveWPService = new ApiService();
