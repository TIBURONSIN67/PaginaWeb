export const META_CONFIG = {
  get phoneNumberId() {
    return process.env.PHONE_NUMBER_ID || '';
  },
  get accessToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN || '';
  },
  get verifyToken() {
    return process.env.VERIFY_TOKEN || '';
  },
  get businessAccountId() {
    return process.env.BUSINESS_ACCOUNT_ID || '';
  },
  get graphApiVersion() {
    return process.env.GRAPH_API_VERSION || 'v23.0';
  },
  get baseUrl() {
    return `https://graph.facebook.com/${this.graphApiVersion}`;
  },
  get messageEndpoint() {
    return `${this.baseUrl}/${this.phoneNumberId}/messages`;
  }
};
