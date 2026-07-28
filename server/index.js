import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import webhookRoutes from './routes/webhook.js';
import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import messageRoutes from './routes/messages.js';
import settingsRoutes from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

logger.info('Database initialized');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://importadora-jyv.netlify.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/webhook', webhookRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/customers', apiLimiter, customerRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`Webhook: http://localhost:${PORT}/api/webhook`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
