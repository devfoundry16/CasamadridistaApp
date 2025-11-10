import axios from "axios";
import { development } from "@/config/environment";
const API_BASE = `${development.DEFAULT_BASE_URL}wc/store`;

export const wooApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});
