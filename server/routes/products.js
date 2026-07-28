import { Router } from 'express';
import db from '../db.js';
import { validate, productSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let query = 'SELECT p.*, GROUP_CONCAT(pc.compatible_model, \', \') as compatible_models FROM products p LEFT JOIN product_compatibility pc ON p.id = pc.product_id WHERE 1=1';
    const params = [];

    if (req.query.search) {
      query += ' AND (p.product_name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR p.description LIKE ? OR p.barcode LIKE ? OR p.supplier LIKE ?)';
      const s = `%${req.query.search}%`;
      params.push(s, s, s, s, s, s, s);
    }
    if (req.query.brand) {
      query += ' AND p.brand LIKE ?';
      params.push(`%${req.query.brand}%`);
    }
    if (req.query.category) {
      query += ' AND p.category = ?';
      params.push(req.query.category);
    }
    if (req.query.supplier) {
      query += ' AND p.supplier LIKE ?';
      params.push(`%${req.query.supplier}%`);
    }
    if (req.query.low_stock === 'true') {
      query += ' AND p.stock <= p.minimum_stock';
    }
    if (req.query.compatible_model) {
      query += ' AND p.id IN (SELECT product_id FROM product_compatibility WHERE compatible_model LIKE ?)';
      params.push(`%${req.query.compatible_model}%`);
    }
    if (req.query.active !== undefined) {
      query += ' AND p.active = ?';
      params.push(parseInt(req.query.active));
    } else {
      query += ' AND p.active = 1';
    }
    if (req.query.min_price) {
      query += ' AND p.sale_price >= ?';
      params.push(parseFloat(req.query.min_price));
    }
    if (req.query.max_price) {
      query += ' AND p.sale_price <= ?';
      params.push(parseFloat(req.query.max_price));
    }

    const sort = req.query.sort || 'product_name';
    const order = (req.query.order || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const validSorts = ['product_name', 'sku', 'brand', 'category', 'stock', 'sale_price', 'created_at'];
    const sortCol = validSorts.includes(sort) ? sort : 'product_name';

    query += ` GROUP BY p.id ORDER BY p.${sortCol} ${order}`;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const countQuery = query.replace(/SELECT p\.\*,.*?FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM');
    const total = db.prepare(countQuery).get(...params)?.total || 0;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const products = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        items: products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    logger.error('Error fetching products', err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(
      'SELECT p.*, GROUP_CONCAT(pc.compatible_model, \', \') as compatible_models FROM products p LEFT JOIN product_compatibility pc ON p.id = pc.product_id WHERE p.id = ? GROUP BY p.id'
    ).get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const compatibilities = db.prepare(
      'SELECT * FROM product_compatibility WHERE product_id = ?'
    ).all(product.id);

    product.compatibilities = compatibilities;

    res.json({ success: true, data: product });
  } catch (err) {
    logger.error('Error fetching product', err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

router.post('/', validate(productSchema), (req, res) => {
  try {
    const data = req.validatedBody;

    const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(data.sku);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A product with this SKU already exists' });
    }

    const result = db.prepare(`
      INSERT INTO products (sku, brand, model, category, product_name, description, purchase_price, sale_price, stock, minimum_stock, barcode, supplier, image_url, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.sku, data.brand, data.model, data.category, data.product_name,
      data.description, data.purchase_price, data.sale_price, data.stock,
      data.minimum_stock, data.barcode, data.supplier, data.image_url, data.active
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    logger.info(`Product created: ${data.product_name} (SKU: ${data.sku})`);

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    logger.error('Error creating product', err);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const data = req.body;
    const fields = [];
    const params = [];

    const allowedFields = ['sku', 'brand', 'model', 'category', 'product_name', 'description', 'purchase_price', 'sale_price', 'stock', 'minimum_stock', 'barcode', 'supplier', 'image_url', 'active'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);
      db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    if (data.compatibilities && Array.isArray(data.compatibilities)) {
      db.prepare('DELETE FROM product_compatibility WHERE product_id = ?').run(req.params.id);
      const insert = db.prepare('INSERT INTO product_compatibility (product_id, compatible_brand, compatible_model, compatible_version) VALUES (?, ?, ?, ?)');
      for (const comp of data.compatibilities) {
        insert.run(req.params.id, comp.compatible_brand || '', comp.compatible_model || '', comp.compatible_version || '');
      }
    }

    const updated = db.prepare(
      'SELECT p.*, GROUP_CONCAT(pc.compatible_model, \', \') as compatible_models FROM products p LEFT JOIN product_compatibility pc ON p.id = pc.product_id WHERE p.id = ? GROUP BY p.id'
    ).get(req.params.id);

    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Error updating product', err);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('UPDATE products SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    logger.error('Error deleting product', err);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

router.post('/:id/compatibility', (req, res) => {
  try {
    const { compatible_brand, compatible_model, compatible_version } = req.body;
    if (!compatible_model) {
      return res.status(400).json({ success: false, error: 'Compatible model is required' });
    }
    const result = db.prepare(
      'INSERT INTO product_compatibility (product_id, compatible_brand, compatible_model, compatible_version) VALUES (?, ?, ?, ?)'
    ).run(req.params.id, compatible_brand || '', compatible_model, compatible_version || '');
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    logger.error('Error adding compatibility', err);
    res.status(500).json({ success: false, error: 'Failed to add compatibility' });
  }
});

router.delete('/:id/compatibility/:compId', (req, res) => {
  try {
    db.prepare('DELETE FROM product_compatibility WHERE id = ? AND product_id = ?').run(req.params.compId, req.params.id);
    res.json({ success: true, message: 'Compatibility removed' });
  } catch (err) {
    logger.error('Error removing compatibility', err);
    res.status(500).json({ success: false, error: 'Failed to remove compatibility' });
  }
});

export default router;
