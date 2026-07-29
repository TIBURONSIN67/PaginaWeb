import db from '../db.js';

export function getStoreSettings() {
  return db.prepare('SELECT * FROM store_settings LIMIT 1').get();
}

export function getCustomerByPhone(phone) {
  return db.prepare('SELECT * FROM customers WHERE phone_number = ?').get(phone);
}

export function createCustomer(phone, name) {
  const exists = getCustomerByPhone(phone);
  if (exists) {
    const cleanName = name && name.trim() ? name.trim() : exists.full_name;
    db.prepare('UPDATE customers SET full_name = COALESCE(NULLIF(?, ?), full_name), updated_at = CURRENT_TIMESTAMP WHERE phone_number = ?')
      .run(cleanName, '', phone);
    return getCustomerByPhone(phone);
  }
  const cleanName = name && name.trim() ? name.trim() : '';
  db.prepare('INSERT INTO customers (phone_number, full_name) VALUES (?, ?)').run(phone, cleanName);
  return getCustomerByPhone(phone);
}

export function getConversationHistory(phone, limit = 30) {
  return db.prepare(
    'SELECT * FROM whatsapp_messages WHERE phone_number = ? ORDER BY created_at DESC LIMIT ?'
  ).all(phone, limit);
}

export function saveWhatsAppMessage(phone, name, message, sender, messageType = 'text', mediaId = '', mediaUrl = '') {
  return db.prepare(
    'INSERT INTO whatsapp_messages (phone_number, customer_name, message, sender, message_type, media_id, media_url, processed) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
  ).run(phone, name || '', message, sender, messageType, mediaId || '', mediaUrl || '');
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `ORD-${y}${m}${d}-${rand}`;
}
