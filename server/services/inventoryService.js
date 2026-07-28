import db from '../db.js';

export const inventoryService = {
  getAll() {
    return db.prepare(`
      SELECT p.*,
        (SELECT MAX(created_at) FROM inventory_movements WHERE product_id = p.id) as last_movement
      FROM products p WHERE p.active = 1
      ORDER BY p.product_name
    `).all();
  },

  getLowStock() {
    return db.prepare(`
      SELECT * FROM products WHERE active = 1 AND stock <= minimum_stock AND stock > 0
      ORDER BY stock ASC
    `).all();
  },

  getOutOfStock() {
    return db.prepare(
      'SELECT * FROM products WHERE active = 1 AND stock <= 0 ORDER BY product_name'
    ).all();
  },

  receiveStock(productId, quantity, reason = '', employee = 'System') {
    db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(quantity, productId);
    db.prepare(
      'INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, employee) VALUES (?, ?, ?, ?, ?)'
    ).run(productId, 'IN', quantity, reason, employee);
  },

  removeStock(productId, quantity, reason = '', employee = 'System') {
    db.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(quantity, productId);
    db.prepare(
      'INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, employee) VALUES (?, ?, ?, ?, ?)'
    ).run(productId, 'OUT', -quantity, reason, employee);
  },

  adjustStock(productId, newQuantity, reason = '', employee = 'System') {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (!product) return;
    const diff = newQuantity - product.stock;
    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newQuantity, productId);
    db.prepare(
      'INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, employee) VALUES (?, ?, ?, ?, ?)'
    ).run(productId, 'ADJUSTMENT', diff, reason, employee);
  },

  getHistory(productId = null, limit = 100) {
    let query = `
      SELECT im.*, p.product_name, p.sku
      FROM inventory_movements im
      LEFT JOIN products p ON im.product_id = p.id
    `;
    const params = [];
    if (productId) {
      query += ' WHERE im.product_id = ?';
      params.push(productId);
    }
    query += ' ORDER BY im.created_at DESC LIMIT ?';
    params.push(limit);
    return db.prepare(query).all(...params);
  }
};
