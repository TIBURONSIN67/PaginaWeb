import { Router } from 'express';
import { inventoryService } from '../services/inventoryService.js';
import { validate, inventoryMovementSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const inventory = inventoryService.getAll();
    res.json({ success: true, data: inventory });
  } catch (err) {
    logger.error('Error fetching inventory', err);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const lowStock = inventoryService.getLowStock();
    const outOfStock = inventoryService.getOutOfStock();
    res.json({
      success: true,
      data: {
        low_stock: lowStock,
        out_of_stock: outOfStock,
        low_stock_count: lowStock.length,
        out_of_stock_count: outOfStock.length
      }
    });
  } catch (err) {
    logger.error('Error fetching alerts', err);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

router.post('/in', validate(inventoryMovementSchema), (req, res) => {
  try {
    const { product_id, quantity, reason, employee = 'System' } = req.validatedBody;
    if (quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be positive' });
    }
    inventoryService.receiveStock(product_id, quantity, reason, employee);
    logger.inventory(`Stock IN: product ${product_id}, qty ${quantity}`);
    res.json({ success: true, message: 'Stock received successfully' });
  } catch (err) {
    logger.error('Error receiving stock', err);
    res.status(500).json({ success: false, error: 'Failed to receive stock' });
  }
});

router.post('/out', validate(inventoryMovementSchema), (req, res) => {
  try {
    const { product_id, quantity, reason, employee = 'System' } = req.validatedBody;
    if (quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Quantity must be positive' });
    }
    inventoryService.removeStock(product_id, quantity, reason, employee);
    logger.inventory(`Stock OUT: product ${product_id}, qty ${quantity}`);
    res.json({ success: true, message: 'Stock removed successfully' });
  } catch (err) {
    logger.error('Error removing stock', err);
    res.status(500).json({ success: false, error: 'Failed to remove stock' });
  }
});

router.post('/adjust', (req, res) => {
  try {
    const { product_id, new_quantity, reason, employee = 'System' } = req.body;
    if (!product_id || new_quantity === undefined) {
      return res.status(400).json({ success: false, error: 'product_id and new_quantity are required' });
    }
    inventoryService.adjustStock(product_id, new_quantity, reason, employee);
    logger.inventory(`Stock ADJUST: product ${product_id}, new qty ${new_quantity}`);
    res.json({ success: true, message: 'Stock adjusted successfully' });
  } catch (err) {
    logger.error('Error adjusting stock', err);
    res.status(500).json({ success: false, error: 'Failed to adjust stock' });
  }
});

router.get('/history', (req, res) => {
  try {
    const productId = req.query.product_id ? parseInt(req.query.product_id) : null;
    const limit = parseInt(req.query.limit) || 100;
    const history = inventoryService.getHistory(productId, limit);
    res.json({ success: true, data: history });
  } catch (err) {
    logger.error('Error fetching history', err);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
