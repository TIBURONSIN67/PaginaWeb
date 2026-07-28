import OpenAI from 'openai';
import { AI_CONFIG } from '../config/openai.js';
import { getStoreSettings, getCustomerByPhone, getConversationHistory } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import db from '../db.js';

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient && AI_CONFIG.apiKey) {
    openaiClient = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
      baseURL: AI_CONFIG.baseURL
    });
  }
  return openaiClient;
}

function buildSystemPrompt(settings) {
  const storeInfo = settings || {};
  return `You are Alex, the AI sales assistant for "${storeInfo.store_name || 'Mobile Parts Store'}".

ABOUT THE STORE:
- Address: ${storeInfo.address || 'N/A'}, ${storeInfo.city || ''}, ${storeInfo.country || ''}
- Phone: ${storeInfo.phone || 'N/A'}
- Email: ${storeInfo.email || 'N/A'}
- Business Hours: ${storeInfo.business_hours || 'Mon-Fri 9AM-6PM'}
- Currency: ${storeInfo.currency || 'USD'}
- About: ${storeInfo.about || 'We sell high-quality mobile phone spare parts.'}

YOUR PERSONALITY:
- Friendly, professional, patient, knowledgeable, and helpful
- Use short responses
- Use emojis sparingly
- Never invent product information or prices
- Always verify stock before confirming availability
- Recommend compatible alternatives when products are unavailable
- Ask follow-up questions when compatibility is unclear (phone model, storage, region, color, carrier)
- If you cannot answer, escalate to a human employee
- Never provide misleading technical information

PRODUCT CATEGORIES: Display, Battery, Charging Port, Flex Cable, Housing, Camera, IC, Connector, Speaker, Microphone, Frame, Back Cover, Accessory, Tool

SUPPORTED BRANDS: Apple (iPhone), Samsung (Galaxy), Xiaomi (Redmi, Poco), Huawei, Oppo, Vivo, OnePlus, Motorola, Google (Pixel), Realme, Infinix, Tecno

CAPABILITIES:
- Search products by name, brand, model, category
- Check current stock levels
- Find compatible replacement parts for specific phone models
- Create quotations for customers
- Create orders for customers
- Track existing orders
- Explain differences between part types (OLED vs LCD, original vs generic)
- Recommend batteries, charging ports, and other parts
- Help identify phone models based on customer descriptions
- Transfer conversations to a human employee when needed

IMPORTANT RULES:
- When asked about a product's availability, ALWAYS use the check_stock tool
- When asked about compatible parts for a phone, ALWAYS use the search_compatibility tool
- When searching for products, ALWAYS use the search_products tool
- Never guess prices or stock levels - use the tools
- If a product is out of stock, suggest alternatives using search_compatibility
- Before creating an order or quote, confirm the customer's details`;
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search products in the inventory by query, brand, model, or category',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (product name, SKU, or keyword)' },
          brand: { type: 'string', description: 'Filter by phone brand (e.g. Samsung, Apple, Xiaomi)' },
          model: { type: 'string', description: 'Filter by phone model (e.g. Galaxy A54, iPhone 13)' },
          category: { type: 'string', description: 'Filter by product category (Display, Battery, Charging Port, etc.)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_stock',
      description: 'Check current stock level for a specific product',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'integer', description: 'The product ID to check stock for' }
        },
        required: ['product_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_compatibility',
      description: 'Find all compatible replacement parts for a specific phone brand and model',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Phone brand (e.g. Samsung, Apple, Xiaomi)' },
          model: { type: 'string', description: 'Phone model (e.g. Galaxy A54, iPhone 13)' }
        },
        required: ['brand', 'model']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_quote',
      description: 'Create a quotation for a customer with products and quantities',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'integer', description: 'Product ID' },
                quantity: { type: 'integer', description: 'Quantity', default: 1 }
              }
            }
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_order',
      description: 'Create a new order for a customer',
      parameters: {
        type: 'object',
        properties: {
          phone_number: { type: 'string', description: 'Customer phone number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'integer', description: 'Product ID' },
                quantity: { type: 'integer', description: 'Quantity' }
              }
            }
          },
          shipping_address: { type: 'string', description: 'Shipping or pickup address' },
          payment_method: { type: 'string', description: 'Payment method (Cash, Transfer, Card)' }
        },
        required: ['phone_number', 'items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'track_order',
      description: 'Track the status of an existing order',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'integer', description: 'Order ID to track' },
          phone_number: { type: 'string', description: 'Customer phone number for verification' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'transfer_to_employee',
      description: 'Transfer the conversation to a human employee for assistance',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for transferring to a human' }
        },
        required: ['reason']
      }
    }
  }
];

async function executeToolCall(name, args) {
  logger.toolCall(name, args);

  switch (name) {
    case 'search_products': {
      let query = 'SELECT p.*, GROUP_CONCAT(pc.compatible_model, \', \') as compatible_models FROM products p LEFT JOIN product_compatibility pc ON p.id = pc.product_id WHERE p.active = 1';
      const params = [];
      const conditions = [];

      if (args.query) {
        conditions.push('(p.product_name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ? OR p.model LIKE ? OR p.description LIKE ? OR p.barcode LIKE ?)');
        const q = `%${args.query}%`;
        params.push(q, q, q, q, q, q);
      }
      if (args.brand) {
        conditions.push('p.brand LIKE ?');
        params.push(`%${args.brand}%`);
      }
      if (args.model) {
        conditions.push('p.model LIKE ?');
        params.push(`%${args.model}%`);
      }
      if (args.category) {
        conditions.push('p.category = ?');
        params.push(args.category);
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id LIMIT 20';

      const products = db.prepare(query).all(...params);
      const storeSettings = getStoreSettings();
      const currency = storeSettings?.currency || 'USD';

      return {
        found: products.length,
        currency,
        products: products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.product_name,
          brand: p.brand,
          model: p.model,
          category: p.category,
          description: p.description,
          price: p.sale_price,
          stock: p.stock,
          supplier: p.supplier,
          compatible_models: p.compatible_models || '',
          in_stock: p.stock > 0
        }))
      };
    }

    case 'check_stock': {
      const product = db.prepare(
        'SELECT id, sku, product_name, brand, model, category, stock, minimum_stock, sale_price FROM products WHERE id = ? AND active = 1'
      ).get(args.product_id);

      if (!product) {
        return { error: 'Product not found' };
      }

      const storeSettings = getStoreSettings();
      const currency = storeSettings?.currency || 'USD';

      let availability;
      if (product.stock <= 0) availability = 'Out of Stock';
      else if (product.stock <= product.minimum_stock) availability = 'Low Stock';
      else availability = 'In Stock';

      return {
        product_id: product.id,
        product_name: product.product_name,
        sku: product.sku,
        current_stock: product.stock,
        minimum_stock: product.minimum_stock,
        price: product.sale_price,
        currency,
        availability
      };
    }

    case 'search_compatibility': {
      const products = db.prepare(`
        SELECT DISTINCT p.*, pc.compatible_model, pc.compatible_version
        FROM products p
        JOIN product_compatibility pc ON p.id = pc.product_id
        WHERE p.active = 1 AND pc.compatible_brand LIKE ? AND pc.compatible_model LIKE ?
        UNION
        SELECT DISTINCT p.*, '' as compatible_model, '' as compatible_version
        FROM products p
        WHERE p.active = 1 AND p.brand LIKE ? AND p.model LIKE ?
        LIMIT 30
      `).all(`%${args.brand}%`, `%${args.model}%`, `%${args.brand}%`, `%${args.model}%`);

      const storeSettings = getStoreSettings();
      const currency = storeSettings?.currency || 'USD';

      return {
        phone_brand: args.brand,
        phone_model: args.model,
        found: products.length,
        currency,
        parts: products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.product_name,
          category: p.category,
          price: p.sale_price,
          stock: p.stock,
          in_stock: p.stock > 0,
          compatible_model: p.compatible_model || `${p.brand} ${p.model}`
        }))
      };
    }

    case 'create_quote': {
      if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
        return { error: 'No items provided for quotation' };
      }

      const storeSettings = getStoreSettings();
      const currency = storeSettings?.currency || 'USD';
      const taxRate = storeSettings?.tax_percentage || 0;

      let items = [];
      let subtotal = 0;

      for (const item of args.items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);
        if (product) {
          const qty = item.quantity || 1;
          const lineTotal = product.sale_price * qty;
          subtotal += lineTotal;
          items.push({
            product_id: product.id,
            name: product.product_name,
            sku: product.sku,
            category: product.category,
            unit_price: product.sale_price,
            quantity: qty,
            subtotal: lineTotal,
            stock: product.stock
          });
        }
      }

      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;

      return {
        type: 'quotation',
        currency,
        tax_percentage: taxRate,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        item_count: items.length
      };
    }

    case 'create_order': {
      if (!args.items || !Array.isArray(args.items) || args.items.length === 0) {
        return { error: 'No items provided for order' };
      }

      const phone = args.phone_number;
      if (!phone) {
        return { error: 'Phone number is required to create an order' };
      }

      const customer = getCustomerByPhone(phone);
      if (!customer) {
        return { error: 'Customer not found. Please verify the phone number.' };
      }

      const storeSettings = getStoreSettings();
      const taxRate = storeSettings?.tax_percentage || 0;
      const currency = storeSettings?.currency || 'USD';

      let subtotal = 0;
      let orderItems = [];

      for (const item of args.items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);
        if (!product) continue;

        const qty = item.quantity || 1;
        const lineTotal = product.sale_price * qty;
        subtotal += lineTotal;

        if (product.stock < qty) {
          return {
            error: `Insufficient stock for ${product.product_name}. Available: ${product.stock}, Requested: ${qty}`
          };
        }

        orderItems.push({ product, qty, lineTotal });
      }

      if (orderItems.length === 0) {
        return { error: 'No valid products found in the order' };
      }

      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;

      const result = db.prepare(
        'INSERT INTO orders (customer_id, status, subtotal, tax, total, payment_method, shipping_address, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(customer.id, 'Pending', subtotal, tax, total, args.payment_method || 'Cash', args.shipping_address || '', 'Pending');

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

      const orderNumber = `ORD-${String(orderId).padStart(6, '0')}`;

      logger.order(`Order #${orderId} created for customer ${customer.full_name || phone}`);

      return {
        success: true,
        order_id: orderId,
        order_number: orderNumber,
        status: 'Pending',
        currency,
        items: orderItems.map(i => ({
          name: i.product.product_name,
          quantity: i.qty,
          unit_price: i.product.sale_price,
          subtotal: i.lineTotal
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        payment_method: args.payment_method || 'Cash',
        message: `Order created successfully! Your order number is ${orderNumber}.`
      };
    }

    case 'track_order': {
      const orderId = args.order_id;
      const phone = args.phone_number;

      let order;
      if (orderId) {
        order = db.prepare(`
          SELECT o.*, c.full_name, c.phone_number
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `).get(orderId);
      } else if (phone) {
        const customer = getCustomerByPhone(phone);
        if (customer) {
          order = db.prepare(`
            SELECT o.*, c.full_name, c.phone_number
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.customer_id = ?
            ORDER BY o.created_at DESC LIMIT 1
          `).get(customer.id);
        }
      }

      if (!order) {
        return { error: 'Order not found. Please check the order ID or phone number.' };
      }

      if (phone && order.phone_number !== phone) {
        order = null;
      }

      if (!order) {
        return { error: 'No order found for this phone number.' };
      }

      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

      const storeSettings = getStoreSettings();
      const currency = storeSettings?.currency || 'USD';

      return {
        order_id: order.id,
        order_number: `ORD-${String(order.id).padStart(6, '0')}`,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total: order.total,
        currency,
        items: items.map(i => ({
          name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal
        })),
        created_at: order.created_at,
        tracking_number: order.tracking_number || 'Not yet assigned',
        customer_name: order.full_name
      };
    }

    case 'transfer_to_employee': {
      if (!args.reason) {
        return { error: 'Reason is required for transfer' };
      }

      db.prepare(
        'INSERT INTO pending_transfers (phone_number, reason) VALUES (?, ?)'
      ).run('unknown', args.reason);

      return {
        success: true,
        message: 'Your request has been forwarded to a human representative. They will contact you shortly during business hours.',
        reason: args.reason
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function processMessage(phone, name, message) {
  const openai = getOpenAI();

  if (!openai) {
    logger.warn('OpenAI API key not configured');
    return 'I apologize, but our AI assistant is not fully configured yet. A human representative will assist you shortly. For urgent inquiries, please call us.';
  }

  try {
    const settings = getStoreSettings();
    const customer = getCustomerByPhone(phone);
    const history = getConversationHistory(phone, AI_CONFIG.conversationMemorySize);

    const systemPrompt = buildSystemPrompt(settings);

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (customer) {
      messages.push({
        role: 'system',
        content: `Current customer: ${customer.full_name || 'Unknown'}, Phone: ${customer.phone_number}, City: ${customer.city || 'Unknown'}, Total Orders: ${customer.total_orders}, Lifetime Value: $${customer.total_spent}`
      });
    }

    const reversed = [...history].reverse();
    for (const msg of reversed) {
      const role = msg.sender === 'customer' ? 'user' : 'assistant';
      messages.push({ role, content: msg.message });
    }

    messages.push({ role: 'user', content: message });

    logger.openai('Sending request to OpenAI');

    let response = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens
    });

    let assistantMessage = response.choices[0].message;

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const result = await executeToolCall(functionName, functionArgs);

        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      messages.push(...toolResults);

      response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens
      });

      assistantMessage = response.choices[0].message;
    }

    const reply = assistantMessage.content || 'I understand. How can I help you further?';
    return reply;

  } catch (err) {
    logger.error('OpenAI processing error', err);
    return 'I apologize, but I encountered a technical issue. Please try again or contact us directly for immediate assistance.';
  }
}
