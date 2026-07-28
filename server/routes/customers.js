import { Router } from 'express';
import db from '../db.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (req.query.search) {
      query += ' AND (full_name LIKE ? OR phone_number LIKE ? OR email LIKE ? OR city LIKE ?)';
      const s = `%${req.query.search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    const customers = db.prepare(query).all(...params);

    const enriched = customers.map(c => {
      const lastOrder = db.prepare(
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(c.id);
      const lastMessage = db.prepare(
        'SELECT * FROM whatsapp_messages WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1'
      ).get(c.phone_number);

      return {
        ...c,
        last_order: lastOrder || null,
        last_message: lastMessage || null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    logger.error('Error fetching customers', err);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const orders = db.prepare(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(customer.id);

    const messages = db.prepare(
      'SELECT * FROM whatsapp_messages WHERE phone_number = ? ORDER BY created_at DESC LIMIT 50'
    ).all(customer.phone_number);

    res.json({
      success: true,
      data: {
        ...customer,
        orders,
        messages,
        orders_count: orders.length,
        messages_count: messages.length
      }
    });
  } catch (err) {
    logger.error('Error fetching customer', err);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

router.post('/', (req, res) => {
  try {
    const { phone_number, full_name, email, city, address, notes } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const existing = db.prepare('SELECT id FROM customers WHERE phone_number = ?').get(phone_number);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Customer with this phone number already exists' });
    }

    const result = db.prepare(
      'INSERT INTO customers (phone_number, full_name, email, city, address, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(phone_number, full_name || '', email || '', city || '', address || '', notes || '');

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    logger.error('Error creating customer', err);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const fields = [];
    const params = [];
    const allowed = ['full_name', 'email', 'city', 'address', 'notes', 'preferred_payment', 'preferred_shipping'];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);
      db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Error updating customer', err);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

export default router;
