import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const hash = createHash('md5').update(Date.now().toString()).digest('hex');
    const ext = path.extname(file.originalname);
    cb(null, `company_logo_${hash}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

let logoFilePath = path.join(uploadsDir, 'company_logo.png');

const router = Router();

router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    logoFilePath = req.file.path;
    res.status(200).json({
      message: 'Logo uploaded successfully',
      file: {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to upload logo', error: error.message });
  }
});

router.get('/logo', (_req, res) => {
  try {
    if (fs.existsSync(logoFilePath)) {
      res.sendFile(logoFilePath);
    } else {
      res.status(404).json({ message: 'No logo found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve logo', error: error.message });
  }
});

export default router;
