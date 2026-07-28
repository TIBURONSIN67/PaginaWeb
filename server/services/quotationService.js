import db from '../db.js';
import { getStoreSettings, formatCurrency } from '../utils/helpers.js';

export const quotationService = {
  generate(items) {
    const settings = getStoreSettings();
    const currency = settings?.currency || 'USD';
    const taxRate = settings?.tax_percentage || 0;

    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(item.product_id);
      if (!product) continue;

      const qty = item.quantity || 1;
      const lineTotal = product.sale_price * qty;
      subtotal += lineTotal;

      lineItems.push({
        product_id: product.id,
        sku: product.sku,
        name: product.product_name,
        brand: product.brand,
        model: product.model,
        category: product.category,
        unit_price: product.sale_price,
        quantity: qty,
        subtotal: lineTotal,
        in_stock: product.stock > 0
      });
    }

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      store_name: settings?.store_name || 'Mobile Parts Store',
      store_email: settings?.email || '',
      store_phone: settings?.phone || '',
      store_address: `${settings?.address || ''}, ${settings?.city || ''}`,
      currency,
      tax_percentage: taxRate,
      items: lineItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      generated_at: new Date().toISOString()
    };
  },

  formatForWhatsApp(quote) {
    let text = `*${quote.store_name} - Quotation*\n`;
    text += `──────────────────────\n\n`;

    for (const item of quote.items) {
      const stockIcon = item.in_stock ? '✓' : '✗';
      text += `*${item.name}*\n`;
      text += `  SKU: ${item.sku}\n`;
      text += `  Qty: ${item.quantity} × ${formatCurrency(item.unit_price, quote.currency)}\n`;
      text += `  Subtotal: ${formatCurrency(item.subtotal, quote.currency)}\n`;
      text += `  Stock: ${stockIcon}\n\n`;
    }

    text += `──────────────────────\n`;
    text += `*Subtotal:* ${formatCurrency(quote.subtotal, quote.currency)}\n`;
    if (quote.tax > 0) {
      text += `*Tax (${quote.tax_percentage}%):* ${formatCurrency(quote.tax, quote.currency)}\n`;
    }
    text += `*Total:* ${formatCurrency(quote.total, quote.currency)}\n\n`;
    text += `_Quotation generated on ${new Date(quote.generated_at).toLocaleString()}_\n`;
    text += `_Valid for 7 days_\n`;

    return text;
  }
};
