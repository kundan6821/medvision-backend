const jwt = require('jsonwebtoken');
const UserService = require('../services/user.service');
const config = require('../config/env.config');

const userService = new UserService();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: true, message: 'All fields are required' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: true, message: 'Password must be at least 6 characters' });
      }

      const user = await userService.createUser({ name, email, password });
      const token = generateToken(user);

      res.status(201).json({ success: true, token, user });
    } catch (error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ error: true, message: error.message });
      }
      res.status(500).json({ error: true, message: 'Registration failed' });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: true, message: 'Email and password are required' });
      }

      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: true, message: 'Invalid email or password' });
      }

      const isValid = await userService.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: true, message: 'Invalid email or password' });
      }

      const safeUser = userService.safeUser(user);
      const token = generateToken(safeUser);

      res.json({ success: true, token, user: safeUser });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Login failed' });
    }
  }

  async getMe(req, res) {
    try {
      const user = await userService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: true, message: 'User not found' });
      }
      res.json({ success: true, user: userService.safeUser(user) });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Failed to fetch user' });
    }
  }
}

module.exports = AuthController;
