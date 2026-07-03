const express = require('express');
const MedicineController = require('../controllers/medicine.controller');

const router = express.Router();
const medicineController = new MedicineController();

router.get('/info', (req, res, next) => medicineController.getMedicineInfo(req, res, next));
router.post('/upload', (req, res, next) => medicineController.uploadMedicineImage(req, res, next));

module.exports = router;
