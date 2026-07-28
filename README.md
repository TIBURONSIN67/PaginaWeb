# Mobile Parts Store - AI-Powered WhatsApp Sales Assistant

A complete production-ready inventory management and AI sales assistant platform for mobile phone spare parts stores. Features an AI-powered WhatsApp assistant using the official Meta WhatsApp Cloud API and OpenAI.

## Features

- **24/7 WhatsApp AI Assistant** - AI-powered sales agent that handles customer inquiries via WhatsApp
- **Smart Product Search** - Search by name, SKU, brand, model, category, or barcode
- **Compatibility Engine** - Automatically recommends compatible replacement parts for any phone model
- **Inventory Management** - Real-time stock tracking with alerts for low and out-of-stock items
- **Order Management** - Full order lifecycle from creation to completion
- **Customer Management** - Automatic customer profiles with purchase history
- **Quotation System** - Generate professional quotations directly from WhatsApp conversations
- **Modern Dashboard** - Clean, responsive admin interface built with React + TailwindCSS
- **OpenAI-Powered** - Context-aware conversations using GPT-4.1 with tool calling
- **Message History** - Complete WhatsApp conversation history with real-time updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | SQLite (better-sqlite3) |
| Frontend | React, Vite, TailwindCSS |
| AI | OpenAI Responses API, GPT-4.1 |
| Messaging | Meta WhatsApp Cloud API v23.0 |
| State | React Query |
| Icons | Lucide Icons |

## Project Structure

```
mobile-parts-store/
├── server/
│   ├── index.js              # Express server entry point
│   ├── db.js                 # SQLite database initialization
│   ├── config/
│   │   ├── meta.js           # Meta WhatsApp API config
│   │   └── openai.js         # OpenAI API config
│   ├── routes/
│   │   ├── webhook.js        # WhatsApp webhook endpoints
│   │   ├── products.js       # Product CRUD APIs
│   │   ├── inventory.js      # Inventory management APIs
│   │   ├── orders.js         # Order management APIs
│   │   ├── customers.js      # Customer management APIs
│   │   ├── messages.js       # Message management APIs
│   │   └── settings.js       # Store settings APIs
│   ├── services/
│   │   ├── assistant.js      # OpenAI assistant with tool calling
│   │   ├── inventoryService.js
│   │   ├── orderService.js
│   │   ├── quotationService.js
│   │   └── whatsappService.js
│   ├── middleware/
│   │   ├── validation.js     # Zod validation schemas
│   │   ├── errorHandler.js   # Global error handling
│   │   └── rateLimiter.js    # Rate limiting
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── helpers.js        # Shared helper functions
│   └── uploads/              # Product image storage
├── client/
│   ├── src/
│   │   ├── pages/            # React page components
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # React Query hooks
│   │   ├── lib/
│   │   │   └── api.js        # API client (axios)
│   │   ├── App.jsx           # Main app with routing
│   │   └── main.jsx          # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json              # Root package with dev script
├── .env.example              # Environment variables template
└── README.md
```

## Prerequisites

- **Node.js** 18+ installed
- **npm** 9+ installed
- A **Meta Developer Account** (for WhatsApp API)
- An **OpenAI API Key** (for AI assistant)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd mobile-parts-store

# Install all dependencies (root, server, and client)
npm install
npm run setup
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key from https://platform.openai.com |
| `OPENAI_MODEL` | OpenAI model (default: gpt-4.1) |
| `PORT` | Server port (default: 3001) |
| `VERIFY_TOKEN` | Custom token for WhatsApp webhook verification |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Cloud API access token |
| `PHONE_NUMBER_ID` | Your WhatsApp Business phone number ID |
| `BUSINESS_ACCOUNT_ID` | Your WhatsApp Business Account ID |
| `GRAPH_API_VERSION` | Meta Graph API version (default: v23.0) |

## Meta WhatsApp Cloud API Setup

### 1. Create a Meta Developer App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in app name and contact email

### 2. Configure WhatsApp

1. In your app dashboard, go to "Add Product" → "WhatsApp"
2. Select or create a Business Account
3. Add a phone number for testing (or use the test number provided)

### 3. Get Your Credentials

- **Phone Number ID**: Found in WhatsApp → API Setup → "Phone Number ID"
- **WhatsApp Access Token**: Generate a temporary access token or create a permanent one via System User
- **Business Account ID**: Found in WhatsApp → API Setup
- **Verify Token**: Create any string (e.g., `my-secret-token-123`) and put it in your `.env`

### 4. Configure Webhook

1. In the WhatsApp API Setup page, click "Configure Webhook"
2. Set Callback URL: `https://your-domain.com/api/webhook`
3. Set Verify Token: The same string you put in `VERIFY_TOKEN`
4. Subscribe to: `messages`
5. For local development, use a tunneling service like ngrok:

```bash
ngrok http 3001
# Use the HTTPS URL as your webhook callback URL
```

## OpenAI Configuration

1. Get your API key from https://platform.openai.com/api-keys
2. Add it to your `.env` file as `OPENAI_API_KEY`
3. The default model is `gpt-4.1` - you can change it to `gpt-4o` or any available model

## Running the Application

### Development

```bash
# Run both backend and frontend simultaneously
npm run dev

# Or run them separately
npm run server   # Backend on http://localhost:3001
npm run client   # Frontend on http://localhost:5173
```

### Production Build

```bash
npm run build
npm start
```

The production build serves the React app from the Express server on port 3001.

## Database

SQLite database is automatically created on first startup at `server/store.db`. Tables are created with all necessary indexes and default settings.

### Tables Created:
- **whatsapp_messages** - All incoming and outgoing WhatsApp messages
- **customers** - Customer profiles (auto-created from WhatsApp interactions)
- **products** - Product catalog with stock levels
- **product_compatibility** - Product-to-phone-model compatibility mapping
- **inventory_movements** - Stock movement history
- **orders** - Customer orders
- **order_items** - Order line items
- **store_settings** - Store configuration
- **pending_transfers** - Conversations pending human takeover

## API Endpoints

All endpoints are under `/api`.

### WhatsApp Webhook
- `GET /api/webhook` - Webhook verification
- `POST /api/webhook` - Receive WhatsApp events

### Products
- `GET /api/products` - List/search products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product

### Inventory
- `GET /api/inventory` - Inventory list
- `GET /api/inventory/alerts` - Low stock alerts
- `POST /api/inventory/in` - Receive stock
- `POST /api/inventory/out` - Remove stock
- `POST /api/inventory/adjust` - Adjust stock
- `GET /api/inventory/history` - Movement history

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Messages
- `GET /api/messages` - Conversation list
- `GET /api/messages/:phone` - Get conversation
- `POST /api/messages/send` - Send manual message

### Settings
- `GET /api/settings` - Get store settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/logo` - Upload store logo

## AI Assistant Capabilities

The AI assistant ("Alex") can:
- Search products by name, brand, model, or category
- Check current stock levels
- Find compatible parts for specific phone models
- Create professional quotations
- Create customer orders directly from WhatsApp
- Track existing orders
- Explain technical differences (OLED vs LCD, original vs generic)
- Recommend alternative products when unavailable
- Transfer conversations to human employees

## Troubleshooting

**Webhook not receiving messages:**
- Ensure your ngrok/public URL is correctly set in Meta Developer Dashboard
- Verify `VERIFY_TOKEN` matches in both `.env` and webhook config
- Check that `WHATSAPP_ACCESS_TOKEN` hasn't expired

**AI not responding:**
- Verify `OPENAI_API_KEY` is valid and has credits
- Check server logs for OpenAI API errors
- Ensure the model name is correct in `OPENAI_MODEL`

**Database issues:**
- Delete `server/store.db` and restart to recreate the database
- Check file permissions on the server directory

## FAQ

**Q: Can I use a different WhatsApp API provider?**
A: This project is built exclusively for the official Meta WhatsApp Cloud API. Twilio and unofficial libraries are not supported.

**Q: Can I use a different database?**
A: The project uses SQLite by default. For production with high concurrency, consider migrating to PostgreSQL.

**Q: Is authentication required?**
A: The WhatsApp webhook is public. The dashboard is currently open but prepared for JWT authentication.

## License

MIT

## Future Improvements Roadmap

- Multi-store support
- Employee accounts with role-based permissions
- Stripe/PayPal payment integration
- Email and SMS notifications
- Advanced analytics and sales reports
- Inventory forecasting with AI
- Image recognition for spare parts identification
- Voice message support
- Multilingual support (Spanish, Portuguese, etc.)
- Docker deployment
- PWA mobile app
