const express = require('express');
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();
const userController = new UserController();

// All user routes require authentication
router.use(authMiddleware);

router.get('/allergies', (req, res) => userController.getAllergies(req, res));
router.post('/allergies', (req, res) => userController.addAllergy(req, res));
router.delete('/allergies/:allergy', (req, res) => userController.removeAllergy(req, res));
router.put('/profile', (req, res) => userController.updateProfile(req, res));

module.exports = router;
