import { Router } from 'express';
import db from '../db.js';
import { whatsappService } from '../services/whatsappService.js';
import { processMessage } from '../services/assistant.js';
import { validate, sendMessageSchema } from '../middleware/validation.js';
import { saveWhatsAppMessage, createCustomer } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let query = `
      SELECT m.phone_number, m.customer_name,
        (SELECT message FROM whatsapp_messages WHERE phone_number = m.phone_number ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM whatsapp_messages WHERE phone_number = m.phone_number ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT sender FROM whatsapp_messages WHERE phone_number = m.phone_number ORDER BY created_at DESC LIMIT 1) as last_sender,
        COUNT(*) as total_messages,
        SUM(CASE WHEN sender = 'customer' AND processed = 0 THEN 1 ELSE 0 END) as unread_count
      FROM whatsapp_messages m
      WHERE 1=1
    `;
    const params = [];

    if (req.query.search) {
      query += ' AND (m.phone_number LIKE ? OR m.customer_name LIKE ?)';
      const s = `%${req.query.search}%`;
      params.push(s, s);
    }
    if (req.query.filter === 'unread') {
      query += ' AND m.processed = 0';
    }

    query += ' GROUP BY m.phone_number ORDER BY last_message_time DESC LIMIT ?';
    params.push(parseInt(req.query.limit) || 100);

    const conversations = db.prepare(query).all(...params);

    res.json({ success: true, data: conversations });
  } catch (err) {
    logger.error('Error fetching messages', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const count = db.prepare(
      "SELECT COUNT(DISTINCT phone_number) as count FROM whatsapp_messages WHERE sender = 'customer' AND processed = 0"
    ).get();
    res.json({ success: true, data: { unread_conversations: count.count } });
  } catch (err) {
    logger.error('Error fetching unread count', err);
    res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
  }
});

router.get('/transfers', (req, res) => {
  try {
    const transfers = db.prepare(
      'SELECT * FROM pending_transfers WHERE resolved = 0 ORDER BY created_at DESC'
    ).all();
    res.json({ success: true, data: transfers });
  } catch (err) {
    logger.error('Error fetching transfers', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transfers' });
  }
});

router.put('/transfers/:id/resolve', (req, res) => {
  try {
    db.prepare('UPDATE pending_transfers SET resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.id);
    res.json({ success: true, message: 'Transfer resolved' });
  } catch (err) {
    logger.error('Error resolving transfer', err);
    res.status(500).json({ success: false, error: 'Failed to resolve transfer' });
  }
});

router.get('/:phone', (req, res) => {
  try {
    const messages = db.prepare(
      'SELECT * FROM whatsapp_messages WHERE phone_number = ? ORDER BY created_at ASC LIMIT 200'
    ).all(req.params.phone);

    db.prepare("UPDATE whatsapp_messages SET processed = 1 WHERE phone_number = ? AND sender = 'customer' AND processed = 0")
      .run(req.params.phone);

    const customer = db.prepare('SELECT * FROM customers WHERE phone_number = ?').get(req.params.phone);

    res.json({
      success: true,
      data: {
        phone_number: req.params.phone,
        customer_name: customer?.full_name || '',
        customer: customer || null,
        messages
      }
    });
  } catch (err) {
    logger.error('Error fetching conversation', err);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
  }
});

router.post('/send', validate(sendMessageSchema), async (req, res) => {
  try {
    const { phone_number, message } = req.validatedBody;

    const customer = db.prepare('SELECT * FROM customers WHERE phone_number = ?').get(phone_number);
    const name = customer?.full_name || 'Customer';

    saveWhatsAppMessage(phone_number, name, message, 'employee', 'text');

    const result = await whatsappService.sendMessage(phone_number, message);

    if (result.success) {
      res.json({ success: true, message: 'Message sent' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    logger.error('Error sending message', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
