import { Router } from 'express';
import db from '../db.js';
import { validate, settingsSchema } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP files are allowed'));
    }
  }
});

const router = Router();

router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM store_settings LIMIT 1').get();
    if (!settings) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    logger.error('Error fetching settings', err);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

router.put('/', validate(settingsSchema), (req, res) => {
  try {
    const data = req.validatedBody;
    const fields = [];
    const params = [];

    const allowed = [
      'store_name', 'phone', 'email', 'address', 'city', 'country',
      'business_hours', 'about', 'facebook', 'instagram', 'tiktok',
      'website', 'currency', 'tax_percentage'
    ];

    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      const settings = db.prepare('SELECT id FROM store_settings LIMIT 1').get();
      if (settings) {
        params.push(settings.id);
        db.prepare(`UPDATE store_settings SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }
    }

    const updated = db.prepare('SELECT * FROM store_settings LIMIT 1').get();
    res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Error updating settings', err);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

router.post('/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE store_settings SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM store_settings LIMIT 1)')
      .run(logoUrl);

    res.json({ success: true, data: { logo_url: logoUrl } });
  } catch (err) {
    logger.error('Error uploading logo', err);
    res.status(500).json({ success: false, error: 'Failed to upload logo' });
  }
});

export default router;
