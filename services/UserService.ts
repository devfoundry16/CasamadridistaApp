import { Address, User } from "@/types/user/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { development } from "@/config/environment";
const DEFAULT_BASE_URL = development.DEFAULT_BASE_URL;
const API_BASE_URL_KEY = "api_base_url_key";
const AUTH_USERNAME = development.AUTH_USERNAME;
const AUTH_PASSWORD = development.AUTH_PASSWORD;
class ApiService {
  private baseUrl: string = DEFAULT_BASE_URL;
  private readonly AUTH_TOKEN_KEY = "jwt_token";
  private readonly USER_ID_KEY = "user_id";
  private readonly USER_KEY = "user_data";
  private readonly GiveWP_API_KEY = "give_wp_api_key";
  private readonly GiveWP_SECRET_KEY = "give_wp_secret_key";
  private readonly GiveWP_TOKEN = "give_wp_token";
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

  async getAuthToken() {
    return AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  async getUserId(): Promise<number | null> {
    const userId = await AsyncStorage.getItem(this.USER_ID_KEY);
    return userId ? parseInt(userId, 10) : null;
  }

  async getUserData() {
    return await AsyncStorage.getItem(this.USER_KEY);
  }

  async getGiveWPAuth() {
    //Get GiveWP Keys
    await this.storeGiveWPData(
      "fdb5d4c7f4795fc2a5322bfc88f2660f",
      "931a3e70dc548a0bbc032d90fc114028",
      "a67af49d175801e596c21c6224dab0db"
    );

    const api_key = await AsyncStorage.getItem(this.GiveWP_API_KEY);
    const secret_key = await AsyncStorage.getItem(this.GiveWP_SECRET_KEY);
    const token = await AsyncStorage.getItem(this.GiveWP_TOKEN);

    return {
      apiKey: api_key,
      secretKey: secret_key,
      token,
    };
  }

  async storeAuthData(token: string, userId: number): Promise<void> {
    await AsyncStorage.multiSet([
      [this.AUTH_TOKEN_KEY, token],
      [this.USER_ID_KEY, userId.toString()],
    ]);
  }

  async storeGiveWPData(apiKey: string, secretKey: string, token: string) {
    await AsyncStorage.multiSet([
      [this.GiveWP_API_KEY, apiKey],
      [this.GiveWP_SECRET_KEY, secretKey],
      [this.GiveWP_TOKEN, token],
    ]);
  }

  async storeUserData(user: User | null) {
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // const token = await AsyncStorage.getItem('jwt_token');
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Basic ${token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response.json();
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("jwt_token");
      if (!token) return false;

      const response = await this.fetchWithAuth("jwt-auth/v1/token/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      console.error("[WordPress] Token validation failed:", error);
      return false;
    }
  }

  async validCrendential(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`${data.message}`);
    }

    return response.json();
  }

  async login(username: string, password: string) {
    const data = await this.validCrendential(username, password);

    const tokenParts = data.token.split(".");
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.data.user.id;

    await this.storeAuthData(data.token, userId); //store auth data

    const userData = await this.getUser();

    this.storeUserData(userData); //store user data

    return userData;
  }

  async register(userData: Omit<User, "id">): Promise<any> {
    const response = await this.fetchWithAuth("wp/v2/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    //set give wp api key
    return response;
  }
  async update(userData: Partial<User>): Promise<any> {
    const response = await this.fetchWithAuth(`wp/v2/users/${userData.id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });

    return response;
  }
  async updateCustomer(data: any): Promise<any> {
    const id = await this.getUserId();
    const body = data;
    const response = await this.fetchWithAuth(`wc/v3/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return response;
  }
  async updateAddress(addressData: Address): Promise<any> {
    const id = await this.getUserId();
    const body =
      addressData.type === "billing"
        ? { billing: addressData }
        : { shipping: addressData };
    const response = await this.fetchWithAuth(`wc/v3/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return response;
  }
  async getAddress(): Promise<any> {
    const id = await this.getUserId();
    const response = await this.fetchWithAuth(`wc/v3/customers/${id}`, {
      method: "get",
    });
    return { shipping: response.shipping, billing: response.billing };
  }

  async logout() {
    await AsyncStorage.removeItem("jwt_token");
    await AsyncStorage.removeItem("user_data");
  }
  async getUser() {
    const [id, token] = await Promise.all([
      this.getUserId(),
      this.getAuthToken(),
    ]);

    const fetchUser = this.fetchWithAuth(`wp/v2/users/${id}?context=edit`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const fetchAddress = this.getAddress();
    const fetchStripeId = this.getStripeId();

    const [response, address, stripe_id] = await Promise.all([
      fetchUser,
      fetchAddress,
      fetchStripeId,
    ]);

    const newData: User = {
      ...response,
      billing: address.billing,
      shipping: address.shipping,
      stripe_id,
    };

    return newData;
  }
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error("[WordPress] Failed to get current user:", error);
      return null;
    }
  }

  async getStripeId(): Promise<string | null> {
    const id = await this.getUserId();
    const response = await this.fetchWithAuth(`wc/v3/customers/${id}`, {
      method: "get",
    });
    return this.findStripeId(response.meta_data);
  }

  findStripeId(meta: { key: string; value: string; id: number }[]): string {
    const item = meta.find((item) => item.key === "stripe_customer_id");
    return item ? item.value : "";
  }

  async uploadMedia(
    fileUri: string, // Local URI of the file, e.g., from image picker
    filename: string // e.g., 'file.jpg'
  ): Promise<any> {
    // Determine Content-Type based on file extension
    let contentType: string;
    if (
      filename.toLowerCase().endsWith(".jpg") ||
      filename.toLowerCase().endsWith(".jpeg")
    ) {
      contentType = "image/jpeg";
    } else if (filename.toLowerCase().endsWith(".png")) {
      contentType = "image/png";
    } else {
      throw new Error(
        "Unsupported file type. Add the appropriate Content-Type."
      );
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: contentType,
      name: filename,
    } as any); // Type assertion for React Native FormData

    // Construct the API endpoint
    const endpoint = `${this.baseUrl}wp/v2/media`;
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
    // Headers with Bearer Token
    const headers = {
      Authorization: `Basic ${token}`,
      // "Content-Disposition": `attachment; filename="${filename}"`,
    };

    try {
      const response = await axios.post(endpoint, formData, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error uploading media:", error.response.data.message);
      throw error;
    }
  }
}

const UserService = new ApiService();
export default UserService;
