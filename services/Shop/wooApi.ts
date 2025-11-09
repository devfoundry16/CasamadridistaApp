import axios from "axios";
const API_BASE = `https://casamadridista.com/wp-json/wc/store`;

export const wooApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});
