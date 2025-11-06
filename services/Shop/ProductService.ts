import AsyncStorage from "@react-native-async-storage/async-storage";
import { WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET, WP_BASE_URL } from "@env";
const DEFAULT_BASE_URL = `${WP_BASE_URL}/wc`;
const API_BASE_URL_KEY = "api_base_url_key";
const WOO_USERNAME = WOO_CONSUMER_KEY; // Replace with actual username
const WOO_PASSWORD = WOO_CONSUMER_SECRET;
class ApiService {
  private baseUrl: string = DEFAULT_BASE_URL;

  async initialize() {
    const savedUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    console.log("Initialized with base URL:", this.baseUrl);
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url;
    await AsyncStorage.setItem(API_BASE_URL_KEY, url);
    console.log("[WordPress] Base URL updated to:", url);
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
    console.log("[WordPress] Fetching:", url);

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
