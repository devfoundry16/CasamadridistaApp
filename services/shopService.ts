import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthService from "./authService";
import { wooApi } from "./wooApi";
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
  async getCartToken() {
    const token = await AsyncStorage.getItem("jwt_token");
    const response = await wooApi.get("/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cart_token = response.headers["cart-token"];
    if (!cart_token) throw new Error("No Cart Token found");
    return cart_token;
  }

  async addItemToCart(productId: number, quantity = 1, variation?: any[]) {
    const token = await AuthService.getJwtToken();
    const cartToken = await this.getCartToken();
    const response = await wooApi.post(
      "/cart/add-item",
      {
        id: productId,
        quantity: quantity,
        variation: variation,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cart-Token": cartToken,
        },
      }
    );
    return response.data;
  }
  async getItemsInCart() {
    const token = await AsyncStorage.getItem("jwt_token");
    const response = await wooApi.get("/cart", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  async removeItemInCart(key: string) {
    const token = await AuthService.getJwtToken();
    const cart_token = await this.getCartToken();
    const response = await wooApi.post(
      "/cart/remove-item",
      {
        key,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cart-Token": cart_token,
        },
      }
    );
    return response.data;
  }
  async updateItemInCart(key: string, quantity: number) {
    const token = await AuthService.getJwtToken();
    const cart_token = await this.getCartToken();

    const response = await wooApi.post(
      "/cart/update-item",
      {
        key,
        quantity,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cart-Token": cart_token,
        },
      }
    );
    return response.data;
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
