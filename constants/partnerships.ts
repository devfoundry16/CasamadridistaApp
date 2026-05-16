import { Linking } from 'react-native';

export const PARTNERSHIP_EMAIL = 'partnerships@casamadridista.com';
export const PARTNERSHIP_SUBJECT = 'Official Fan Club Partnership Inquiry';

export const ENABLE_HOME_PARTNERSHIP_BANNER = true;

export function openPartnershipInquiry(): void {
  const encoded = encodeURIComponent(PARTNERSHIP_SUBJECT);
  Linking.openURL(`mailto:${PARTNERSHIP_EMAIL}?subject=${encoded}`);
}
