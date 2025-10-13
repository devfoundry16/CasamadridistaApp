import AsyncStorage from "@react-native-async-storage/async-storage";
const DEFAULT_BASE_URL = "https://casamadridista.com/wp-json/wc";
const API_BASE_URL_KEY = "api_base_url_key";
const AUTH_USERNAME = "ck_5761f8ce313356e07555cf14a8c2099ab27d7942"; // Replace with actual username
const AUTH_PASSWORD = "cs_72d03b9110f7f1e3592f5c4a77cbd7c42b176075";
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
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
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

  async getProducts(): Promise<any[]> {
    return this.fetchWithAuth("/v3/products", {
      method: "GET",
    });
  }
  async getProductById(id: number): Promise<any> {
    return this.fetchWithAuth(`/v3/products/${id}`);
  }
}

const ShopApiService = new ApiService();
export default ShopApiService;
 