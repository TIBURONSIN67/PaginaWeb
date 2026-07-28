export const AI_CONFIG = {
  get provider() {
    return process.env.AI_PROVIDER || 'openai';
  },
  get apiKey() {
    if (this.provider === 'deepseek') {
      return process.env.DEEPSEEK_API_KEY || '';
    }
    return process.env.OPENAI_API_KEY || '';
  },
  get baseURL() {
    if (this.provider === 'deepseek') {
      return process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    }
    return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  },
  get model() {
    if (this.provider === 'deepseek') {
      return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    }
    return process.env.OPENAI_MODEL || 'gpt-4.1';
  },
  temperature: 0.7,
  maxTokens: 1024,
  conversationMemorySize: 30
};
