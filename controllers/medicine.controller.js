const MedicineService = require('../services/medicine.service');
const OCRService = require('../services/ocr.service');
const { validateMedicineName } = require('../utils/validator');
const { formatMedicineResponse, formatErrorResponse } = require('../utils/formatter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

class MedicineController {
  constructor(medicineService = new MedicineService(), ocrService = new OCRService()) {
    this.medicineService = medicineService;
    this.ocrService = ocrService;
    this.upload = upload.single('image');
  }

  async getMedicineInfo(req, res, next) {
    try {
      const { name, allergies } = req.query;
      
      const validation = validateMedicineName(name);
      if (!validation.valid) {
        return res.status(400).json(formatErrorResponse(validation.error));
      }

      // Parse allergies from query if passed: ?allergies=Aspirin,Penicillin
      let userAllergies = [];
      if (allergies) {
        userAllergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
         // Auto-fetch if token is provided
         const jwt = require('jsonwebtoken');
         const config = require('../config/env.config');
         const UserService = require('../services/user.service');
         try {
           const token = req.headers.authorization.substring(7);
           const decoded = jwt.verify(token, config.jwtSecret);
           const userService = new UserService();
           const user = await userService.findById(decoded.id);
           if (user && user.allergies) {
             userAllergies = user.allergies;
           }
         } catch(e) {
           // Invalid token, just proceed without allergies
         }
      }

      const result = await this.medicineService.getMedicineInfo(validation.value, userAllergies);
      
      res.json(formatMedicineResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async uploadMedicineImage(req, res, next) {
    this.upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json(formatErrorResponse(err.message));
      }

      if (!req.file) {
        return res.status(400).json(formatErrorResponse('No image file uploaded'));
      }

      try {
        const imagePath = req.file.path;
        
        // Extract text from image using OCR
        const ocrResult = await this.ocrService.extractTextFromImage(imagePath);

        // Auto-fetch user allergies from token if present
        let userAllergies = [];
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          const jwt = require('jsonwebtoken');
          const config = require('../config/env.config');
          const UserService = require('../services/user.service');
          try {
            const token = req.headers.authorization.substring(7);
            const decoded = jwt.verify(token, config.jwtSecret);
            const userService = new UserService();
            const user = await userService.findById(decoded.id);
            if (user && user.allergies) userAllergies = user.allergies;
          } catch(e) {}
        }

        const medicineResult = await this.medicineService.getMedicineInfo(ocrResult.medicineName, userAllergies);
        
        // Clean up uploaded file and processed file
        fs.unlinkSync(imagePath);
        const processedPath = imagePath.replace(path.extname(imagePath), '_processed.png');
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
        
        // Add OCR info to response
        const response = formatMedicineResponse(medicineResult);
        response.ocr_info = {
          extracted_text: ocrResult.fullText,
          detected_medicine: ocrResult.medicineName,
          confidence: Math.round(ocrResult.confidence)
        };
        
        res.json(response);
      } catch (error) {
        // Clean up files on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          const processedPath = req.file.path.replace(path.extname(req.file.path), '_processed.png');
          if (fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
          }
        }
        next(error);
      }
    });
  }
}

module.exports = MedicineController;
