import db from '../db.js';

export const orderService = {
  getAll(filters = {}) {
    let query = `
      SELECT o.*, c.full_name as customer_name, c.phone_number,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND o.status = ?';
      params.push(filters.status);
    }
    if (filters.customer_id) {
      query += ' AND o.customer_id = ?';
      params.push(filters.customer_id);
    }
    if (filters.search) {
      query += ' AND (c.full_name LIKE ? OR c.phone_number LIKE ? OR o.id LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.date_from) {
      query += ' AND o.created_at >= ?';
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      query += ' AND o.created_at <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY o.created_at DESC LIMIT 200';
    return db.prepare(query).all(...params);
  },

  getById(id) {
    const order = db.prepare(`
      SELECT o.*, c.full_name as customer_name, c.phone_number, c.email as customer_email, c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);

    if (!order) return null;

    order.items = db.prepare(`
      SELECT oi.*, p.sku, p.brand, p.model, p.category
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    return order;
  },

  create(data) {
    const { customer_id, items, payment_method, shipping_address, notes, discount = 0 } = data;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);

      const qty = item.quantity || 1;
      const lineTotal = product.sale_price * qty;
      subtotal += lineTotal;

      if (product.stock < qty) {
        throw new Error(`Insufficient stock for ${product.product_name}. Available: ${product.stock}`);
      }

      orderItems.push({ product, qty, lineTotal });
    }

    const storeSettings = db.prepare('SELECT * FROM store_settings LIMIT 1').get();
    const taxRate = storeSettings?.tax_percentage || 0;
    subtotal -= discount;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const result = db.prepare(
      'INSERT INTO orders (customer_id, status, subtotal, tax, discount, total, payment_method, shipping_address, notes, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(customer_id, 'Pending', subtotal, tax, discount, total, payment_method || 'Cash', shipping_address || '', notes || '', 'Pending');

    const orderId = result.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (const item of orderItems) {
      insertItem.run(orderId, item.product.id, item.product.product_name, item.qty, item.product.sale_price, item.lineTotal);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.product.id);
      db.prepare(
        'INSERT INTO inventory_movements (product_id, movement_type, quantity, reason) VALUES (?, ?, ?, ?)'
      ).run(item.product.id, 'SALE', -item.qty, `Order #${orderId}`);
    }

    db.prepare('UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(total, customer_id);

    return this.getById(orderId);
  },

  updateStatus(id, status) {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return this.getById(id);
  },

  update(id, data) {
    const fields = [];
    const params = [];

    if (data.payment_method !== undefined) { fields.push('payment_method = ?'); params.push(data.payment_method); }
    if (data.payment_status !== undefined) { fields.push('payment_status = ?'); params.push(data.payment_status); }
    if (data.shipping_address !== undefined) { fields.push('shipping_address = ?'); params.push(data.shipping_address); }
    if (data.tracking_number !== undefined) { fields.push('tracking_number = ?'); params.push(data.tracking_number); }
    if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes); }
    if (data.discount !== undefined) {
      fields.push('discount = ?');
      params.push(data.discount);
      const order = db.prepare('SELECT subtotal FROM orders WHERE id = ?').get(id);
      const settings = db.prepare('SELECT tax_percentage FROM store_settings LIMIT 1').get();
      const newSubtotal = order.subtotal - data.discount;
      const newTax = newSubtotal * ((settings?.tax_percentage || 0) / 100);
      const newTotal = newSubtotal + newTax;
      fields.push('total = ?');
      params.push(newTotal);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    return this.getById(id);
  },

  getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const orders = db.prepare(
      "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders WHERE date(created_at) = ? AND status != 'Cancelled'"
    ).get(today);
    return {
      count: orders.count || 0,
      revenue: orders.revenue || 0
    };
  },

  getRecent(limit = 10) {
    return db.prepare(`
      SELECT o.*, c.full_name as customer_name, c.phone_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC LIMIT ?
    `).all(limit);
  }
};
