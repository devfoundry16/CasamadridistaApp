import AsyncStorage from "@react-native-async-storage/async-storage";
import { development } from "@/config/environment";
const DEFAULT_BASE_URL = `${development.DEFAULT_BASE_URL}wc`;
const API_BASE_URL_KEY = development.API_BASE_URL_KEY;
const WOO_USERNAME = development.WOO_USERNAME; // Replace with actual username
const WOO_PASSWORD = development.WOO_PASSWORD;
class ApiService {
  private baseUrl: string = DEFAULT_BASE_URL;

  async initialize() {
    const savedUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url;
    await AsyncStorage.setItem(API_BASE_URL_KEY, url);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // const token = await AsyncStorage.getItem('jwt_token');
    const token = btoa(`${WOO_USERNAME}:${WOO_PASSWORD}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers["Authorization"] = `Basic ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WordPress] Error:", response.status, errorText);
      throw new Error(`WordPress API Error: ${response.status} ${errorText}`);
    }

    return response.json();
  }
  async getAllProducts(): Promise<any[]> {
    return this.fetchWithAuth("/v3/products", {
      method: "GET",
    });
  }
  async getSubscriptionProducts(): Promise<any[]> {
    return this.fetchWithAuth("/v3/products?type=variable-subscription", {
      method: "GET",
    });
  }
  async getProducts(): Promise<any[]> {
    return this.fetchWithAuth("/v3/products?status=publish&virtual=false", {
      method: "GET",
    });
  }
  async getProductById(id: number): Promise<any> {
    return this.fetchWithAuth(`/v3/products/${id}`);
  }
}

const ProductApiService = new ApiService();
export default ProductApiService;
