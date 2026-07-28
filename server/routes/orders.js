import { Router } from 'express';
import { orderService } from '../services/orderService.js';
import { validate, orderSchema, updateOrderStatusSchema } from '../middleware/validation.js';
import { getCustomerByPhone, createCustomer } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      customer_id: req.query.customer_id ? parseInt(req.query.customer_id) : undefined,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };
    const orders = orderService.getAll(filters);
    res.json({ success: true, data: orders });
  } catch (err) {
    logger.error('Error fetching orders', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

router.get('/stats/today', (req, res) => {
  try {
    const stats = orderService.getTodayStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('Error fetching stats', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

router.get('/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recent = orderService.getRecent(limit);
    res.json({ success: true, data: recent });
  } catch (err) {
    logger.error('Error fetching recent orders', err);
    res.status(500).json({ success: false, error: 'Failed to fetch recent orders' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = orderService.getById(parseInt(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Error fetching order', err);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

router.post('/', validate(orderSchema), (req, res) => {
  try {
    const data = req.validatedBody;

    let customerId = data.customer_id;
    if (!customerId && data.phone_number) {
      const customer = getCustomerByPhone(data.phone_number);
      if (customer) customerId = customer.id;
    }

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Customer ID or valid phone number required' });
    }

    const order = orderService.create({ ...data, customer_id: customerId });
    logger.order(`Order #${order.id} created`);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    logger.error('Error creating order', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create order' });
  }
});

router.put('/:id/status', validate(updateOrderStatusSchema), (req, res) => {
  try {
    const order = orderService.updateStatus(parseInt(req.params.id), req.validatedBody.status);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    logger.order(`Order #${order.id} status updated to ${req.validatedBody.status}`);
    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Error updating order status', err);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const order = orderService.update(parseInt(req.params.id), req.body);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Error updating order', err);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

export default router;
