/*
Punto de entrada principal del servidor Express.

Responsabilidades:
- Inicializar base de datos SQLite.
- Configurar CORS, proxies y middlewares.
- Montar todas las rutas de la API.
- Servir el frontend React en producción.
- Iniciar el servidor HTTP en el puerto configurado.

Arquitectura:
  index.js → routes/*.js → services/*.js → base de datos / APIs externas
*/

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

// Confiar en el proxy de Render para rate limiting correcto
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;

// Logs de diagnóstico al iniciar
logger.info('Base de datos inicializada');
logger.info(`Proveedor IA: ${process.env.AI_PROVIDER || 'openai'}`);
logger.info(`DeepSeek API Key: ${process.env.DEEPSEEK_API_KEY ? 'configurada' : 'NO CONFIGURADA'}`);
logger.info(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'configurada' : 'NO CONFIGURADA'}`);

// CORS: orígenes permitidos desde variable de entorno o defaults
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parseo de JSON con límite de 10MB para archivos multimedia
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (uploads de logos, etc.)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== RUTAS DE LA API ==========

// Webhook de Meta WhatsApp (sin rate limit global, tiene el suyo)
app.use('/api/webhook', webhookRoutes);

// Rutas protegidas con rate limiting
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/inventory', apiLimiter, inventoryRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/customers', apiLimiter, customerRoutes);
app.use('/api/messages', apiLimiter, messageRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// En producción, servir el frontend React compilado
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // SPA: todas las rutas no-API van al index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    }
  });
}

// Manejo de errores 404 y 500
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
  logger.info(`API: http://localhost:${PORT}/api`);
  logger.info(`Webhook: http://localhost:${PORT}/api/webhook`);
  logger.info(`Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
});

export default app;
