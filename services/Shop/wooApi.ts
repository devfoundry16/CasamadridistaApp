import axios from "axios";
import { WP_BASE_URL } from "@env";
const API_BASE = `${WP_BASE_URL}/wc/store`;

export const wooApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});
