/**
 * Professional Color System for Casa Madridista
 * Real Madrid Theme: Gold (#BC9045) and White (#FFFFFF)
 */

const Colors = {
  // Brand Colors
  brand: {
    gold: "#BC9045",
    white: "#FFFFFF",
    navy: "#001F3F",
  },

  // Primary Theme Colors
  primary: "#BC9045", // Real Madrid Gold
  secondary: "#FFFFFF", // White
  accent: "#BC9045", // Gold accent

  // Background Colors
  background: {
    dark: "#0A0A0A",
    deepDark: "#1A1A1A",
    medium: "#2A2A2A",
    card: "#2F2F2F",
    light: "#3A3A3A",
    gray: "#515151",
  },

  // Text Colors
  text: {
    primary: "#FFFFFF", // White text
    secondary: "#CCCCCC",
    tertiary: "#A0A0A0",
    muted: "#666666",
    dark: "#1A1A1A",
  },

  // Border Colors
  border: {
    default: "#3A3A3A",
    light: "#4A4A4A",
    medium: "#E0E0E0",
    subtle: "#E5E7EB",
  },

  // Status Colors
  status: {
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#0033A0",
  },

  // UI Element Colors
  ui: {
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#BC9045",
    inputBg: "#3A3A3A",
    buttonBg: "#BC9045",
  },

  // Legacy compatibility (to be removed after migration)
  darkGold: "#BC9045",
  royalBlue: "#0033A0",
  lightGray: "#F5F5F5",
  mediumGray: "#E0E0E0",
  darkGray: "#515151",
  lightDarkGray: "#555555",
  deepDarkGray: "#2A2A2A",
  textLight: "#666666",
  textWhite: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
  darkBg: "#0A0A0A",
  cardBg: "#2F2F2F",
} as const;

export default Colors;
