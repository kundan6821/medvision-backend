const UserService = require('../services/user.service');

const userService = new UserService();

class UserController {
  async getAllergies(req, res) {
    try {
      const user = await userService.findById(req.user.id);
      if (!user) return res.status(404).json({ error: true, message: 'User not found' });
      res.json({ success: true, allergies: user.allergies });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Failed to fetch allergies' });
    }
  }

  async addAllergy(req, res) {
    try {
      const { allergy } = req.body;
      if (!allergy || !allergy.trim()) {
        return res.status(400).json({ error: true, message: 'Allergy name is required' });
      }
      const user = await userService.addAllergy(req.user.id, allergy.trim());
      res.json({ success: true, allergies: user.allergies });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Failed to add allergy' });
    }
  }

  async removeAllergy(req, res) {
    try {
      const { allergy } = req.params;
      const user = await userService.removeAllergy(req.user.id, decodeURIComponent(allergy));
      res.json({ success: true, allergies: user.allergies });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Failed to remove allergy' });
    }
  }

  async updateProfile(req, res) {
    try {
      const { name } = req.body;
      const user = await userService.updateProfile(req.user.id, { name });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: true, message: 'Failed to update profile' });
    }
  }
}

module.exports = UserController;
