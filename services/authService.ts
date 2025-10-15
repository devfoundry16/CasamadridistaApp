import { AuthResponse, User } from "@/types/user/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
const DEFAULT_BASE_URL = "https://casamadridista.com/wp-json";
const API_BASE_URL_KEY = "api_base_url_key";
const AUTH_USERNAME = "iworqs"; // Replace with actual username
const AUTH_PASSWORD = "P8u4 vcXa 7FrR mWXP eVla jstg";
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
  
  async getJwtToken() {
    return AsyncStorage.getItem("jwt_token");
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

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/jwt-auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again.";
      // Re-throw for upper layers to handle
      throw new Error(message);
    }

    const data = await response.json();

    console.log("[WordPress] Login successful:", data.user_display_name);
    return data;
  }

  async register(userData: Omit<User, "id">): Promise<any> {
    const response = await this.fetchWithAuth("/wp/v2/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again.";
      // Re-throw for upper layers to handle
      throw new Error(message);
    }
    const data = await response.json();

    console.log("[WordPress] Register successful:", data);
    return data;
  }
  async update(userData: Partial<User>): Promise<any> {
    const response = await this.fetchWithAuth(`/wp/v2/users/${userData.id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again.";
      // Re-throw for upper layers to handle
      throw new Error(message);
    }
    const data = await response.json();

    console.log("[WordPress] Update successful:", data);
    return data;
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("jwt_token");
      if (!token) return false;

      const response = await fetch(
        `${this.baseUrl}/jwt-auth/v1/token/validate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("[WordPress] Token validation failed:", error);
      return false;
    }
  }

  async logout() {
    await AsyncStorage.removeItem("jwt_token");
    await AsyncStorage.removeItem("user_data");
    console.log("[WordPress] Logged out");
  }
  async getUserById(id: number, token: string): Promise<User | null> {
    const response = await fetch(
      `${this.baseUrl}/wp/v2/users/${id}?context=edit`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const message =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong. Please try again.";
      // Re-throw for upper layers to handle
      throw new Error(message);
    }
    const data = response.json();

    return data;
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
    const endpoint = `${this.baseUrl}/wp/v2/media`;
    const token = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
    // Headers with Bearer Token
    const headers = {
      Authorization: `Basic ${token}`,
      // "Content-Disposition": `attachment; filename="${filename}"`,
    };

    try {
      const response = await axios.post(endpoint,
        formData,
        {
          headers
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error uploading media:", error.response.data.message);
      throw error;
    }
  }
}

const AuthService = new ApiService();
export default AuthService;
