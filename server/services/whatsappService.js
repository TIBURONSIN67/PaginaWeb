import axios from 'axios';
import { META_CONFIG } from '../config/meta.js';
import { logger } from '../utils/logger.js';

export const whatsappService = {
  async sendMessage(phone, message) {
    if (!META_CONFIG.accessToken || !META_CONFIG.phoneNumberId) {
      logger.warn('WhatsApp credentials not configured');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const response = await axios.post(
        META_CONFIG.messageEndpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${META_CONFIG.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.outgoing(phone, message.substring(0, 100));
      return { success: true, data: response.data };
    } catch (err) {
      logger.error('Failed to send WhatsApp message', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  async sendImage(phone, imageUrl, caption = '') {
    if (!META_CONFIG.accessToken || !META_CONFIG.phoneNumberId) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const response = await axios.post(
        META_CONFIG.messageEndpoint,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption || undefined
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${META_CONFIG.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (err) {
      logger.error('Failed to send WhatsApp image', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  extractMessageData(body) {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value || {};

      if (value.messages && value.messages.length > 0) {
        const msg = value.messages[0];
        const contact = value.contacts?.[0];

        let messageText = '';
        let messageType = 'text';

        if (msg.type === 'text' && msg.text) {
          messageText = msg.text.body || '';
          messageType = 'text';
        } else if (msg.type === 'image') {
          messageText = '[Image received]';
          messageType = 'image';
        } else if (msg.type === 'document') {
          messageText = '[Document received]';
          messageType = 'document';
        } else if (msg.type === 'audio') {
          messageText = '[Audio message]';
          messageType = 'audio';
        } else if (msg.type === 'location') {
          messageText = '[Location shared]';
          messageType = 'location';
        } else {
          messageText = '[Unsupported message type]';
          messageType = msg.type || 'unsupported';
        }

        return {
          phone: msg.from,
          name: contact?.profile?.name || 'Customer',
          message: messageText,
          messageType,
          timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString(),
          messageId: msg.id
        };
      }

      if (value.statuses && value.statuses.length > 0) {
        return {
          type: 'status',
          status: value.statuses[0].status,
          messageId: value.statuses[0].id,
          phone: value.statuses[0].recipient_id
        };
      }

      return null;
    } catch (err) {
      logger.error('Failed to extract message data', err);
      return null;
    }
  }
};
