const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

class UserService {
  safeUser(user) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findById(id) {
    return User.findOne({ id });
  }

  async createUser({ name, email, password }) {
    const existing = await this.findByEmail(email);
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      allergies: [],
      createdAt: new Date().toISOString()
    });

    return this.safeUser(newUser);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async addAllergy(userId, allergy) {
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error('User not found');

    const normalized = allergy.trim();
    if (!user.allergies.includes(normalized)) {
      user.allergies.push(normalized);
      await user.save();
    }
    return this.safeUser(user);
  }

  async removeAllergy(userId, allergy) {
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error('User not found');

    user.allergies = user.allergies.filter(a => a !== allergy);
    await user.save();
    return this.safeUser(user);
  }

  async updateProfile(userId, updates) {
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error('User not found');

    if (updates.name) user.name = updates.name.trim();
    await user.save();
    return this.safeUser(user);
  }
}

module.exports = UserService;
