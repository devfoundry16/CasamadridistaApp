import axios, { AxiosInstance } from "axios";
import UserService from "../UserService";
class ApiService {
  private api: AxiosInstance;
  private auth: any;
  private token = "";
  constructor() {
    this.api = axios.create({
      baseURL: "https://casamadridista.com/give-api",
      headers: {
        "Content-Type": "application/json",
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
      const response = await this.api.get(`/donors`, {
        params: {
          key: params.apiKey,
          token: params.token,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
  async getForms() {
    const params = await this.getAuth();
    try {
      const response = await this.api.get(`/forms`, {
        params: {
          key: params.apiKey,
          token: params.token,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
    }
  }
}

export const GiveWPService = new ApiService();
