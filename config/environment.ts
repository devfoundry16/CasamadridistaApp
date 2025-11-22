import { Platform } from "react-native";

const API_BASE_URL = Platform.select({
  ios: "http://localhost:3000/api/", // iOS Simulator
  android: "https://casamadridista-backend.vercel.app/api/", // Android Emulator
});

const development = {
  AUTH_USERNAME: "iworqs",
  AUTH_PASSWORD: "P8u4 vcXa 7FrR mWXP eVla jstg",
  WOO_USERNAME: "ck_5761f8ce313356e07555cf14a8c2099ab27d7942",
  WOO_PASSWORD: "cs_72d03b9110f7f1e3592f5c4a77cbd7c42b176075",
  DEFAULT_BASE_URL: "https://casamadridista.com/wp-json/",
  DEFAULT_BACKEND_API_URL: API_BASE_URL,
  DEFAULT_BACKEND_URL: API_BASE_URL?.slice(0, -5),
  API_BASE_URL_KEY: "api_base_url_key",
  STRIPE_PUBLISHABLE_KEY:
    "pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c",
  PAYPAL_CLIENT_ID:
    "AatmU4dh1rXaxbvYSOCXIL-mQPSeUZQeX2xZabaei0XydRTpR3ewgBtvXl8E_ZW0tSIvBWEia6Xxgohs",
  PAYPAL_CLIENT_SECRET:
    "EMx_LLE_qS6Kj8k-u43rjDKyvDuGhe-10VuCqXoX0srXFNjanvqY-nyvvX8DQ0GtaiD57h2atBm4EQ4l",
  PAYPAL_MODE: "sandbox",
};

const production = {};

export { development, production };
