import { Router } from 'express';
import { META_CONFIG } from '../config/meta.js';
import { whatsappService } from '../services/whatsappService.js';
import { processMessage } from '../services/assistant.js';
import { saveWhatsAppMessage, createCustomer, getConversationHistory } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { webhookLimiter } from '../middleware/rateLimiter.js';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info(`Webhook verification: mode=${mode}, token=${token}`);

  if (mode === 'subscribe' && token === META_CONFIG.verifyToken) {
    logger.info('Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn('Webhook verification failed');
  return res.sendStatus(403);
});

router.post('/', webhookLimiter, async (req, res) => {
  console.log("🔥 MENSAJE RECIBIDO DE META");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const messageData = whatsappService.extractMessageData(req.body);

    if (!messageData) {
      console.log("⚠️ Evento recibido pero no es mensaje");
      return res.status(200).json({ success: true, message: 'Non-message event received' });
    }

    if (messageData.type === 'status') {
      logger.info(`Message status update: ${messageData.status} for ${messageData.messageId}`);
      return res.status(200).json({ success: true });
    }

    const { phone, name, message, messageType } = messageData;

    logger.incoming(phone, name, message);

    createCustomer(phone, name);
    saveWhatsAppMessage(phone, name, message, 'customer', messageType);

    res.status(200).json({ success: true, message: 'Received' });

    const aiReply = await processMessage(phone, name, message);

    saveWhatsAppMessage(phone, name, aiReply, 'ai', 'text');

    if (messageData.phone) {
      await whatsappService.sendMessage(messageData.phone, aiReply);
    }

  } catch (err) {
    logger.error('Webhook processing error', err);
    console.error("❌ ERROR WEBHOOK:", err);

    res.status(200).json({ success: true, message: 'Received but processing error' });
  }
});

router.get('/webhook-status', (req, res) => {
  const configured = !!(
    META_CONFIG.accessToken &&
    META_CONFIG.phoneNumberId &&
    META_CONFIG.verifyToken
  );

  res.json({
    success: true,
    data: {
      configured,
      phone_number_id: META_CONFIG.phoneNumberId
        ? `${META_CONFIG.phoneNumberId.substring(0, 8)}...`
        : null,
      verify_token_set: !!META_CONFIG.verifyToken,
      access_token_set: !!META_CONFIG.accessToken,
      graph_api_version: META_CONFIG.graphApiVersion
    }
  });
});

router.post('/webhook-test', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number required'
    });
  }

  if (!META_CONFIG.accessToken) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp not configured'
    });
  }

  const result = await whatsappService.sendMessage(
    phone,
    'This is a test message from Mobile Parts Store. Your WhatsApp integration is working correctly!'
  );

  if (result.success) {
    res.json({
      success: true,
      message: 'Test message sent successfully'
    });
  } else {
    res.status(500).json({
      success: false,
      error: result.error
    });
  }
});

export default router;