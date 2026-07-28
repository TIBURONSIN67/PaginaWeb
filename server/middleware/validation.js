import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  brand: z.string().optional().default(''),
  model: z.string().optional().default(''),
  category: z.enum(['Display','Battery','Charging Port','Flex Cable','Housing','Camera','IC','Connector','Speaker','Microphone','Frame','Back Cover','Accessory','Tool']).optional().default('Accessory'),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().default(''),
  purchase_price: z.number().min(0).optional().default(0),
  sale_price: z.number().min(0).optional().default(0),
  stock: z.number().int().min(0).optional().default(0),
  minimum_stock: z.number().int().min(0).optional().default(5),
  barcode: z.string().optional().default(''),
  supplier: z.string().optional().default(''),
  image_url: z.string().optional().default(''),
  active: z.number().int().min(0).max(1).optional().default(1)
});

export const orderSchema = z.object({
  customer_id: z.number().int().positive().optional(),
  phone_number: z.string().optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive().default(1)
  })).min(1, 'At least one item required'),
  payment_method: z.string().optional().default('Cash'),
  shipping_address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  discount: z.number().min(0).optional().default(0)
});

export const sendMessageSchema = z.object({
  phone_number: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required')
});

export const settingsSchema = z.object({
  store_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  business_hours: z.string().optional(),
  about: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().optional(),
  tax_percentage: z.number().min(0).optional()
});

export const inventoryMovementSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int(),
  reason: z.string().optional().default(''),
  employee: z.string().optional().default('System')
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Pending','Confirmed','Preparing','Ready for Pickup','Shipped','Completed','Cancelled'])
});
