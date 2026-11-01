const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');

const USERS_FILE = path.join(__dirname, '../database/users.json');

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.users)) return data.users;
    return [];
  } catch (err) {
    console.error('Error reading users.json:', err.message);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
  } catch (err) {
    console.error('Error saving users to file:', err.message);
  }
}

class UserService {
  safeUser(user) {
    if (!user) return null;
    const u = user.toObject ? user.toObject() : { ...user };
    const { password, _id, __v, ...safe } = u;
    return safe;
  }

  async findByEmail(email) {
    const normalized = (email || '').toLowerCase().trim();
    if (isMongoConnected()) {
      try {
        const user = await User.findOne({ email: normalized });
        if (user) return user.toObject ? user.toObject() : user;
      } catch (err) {
        console.warn('MongoDB findByEmail error, falling back to local file:', err.message);
      }
    }
    return loadUsers().find(u => u.email === normalized) || null;
  }

  async findById(id) {
    const targetId = String(id);
    if (isMongoConnected()) {
      try {
        const user = await User.findOne({ id: targetId });
        if (user) return user.toObject ? user.toObject() : user;
      } catch (err) {
        console.warn('MongoDB findById error, falling back to local file:', err.message);
      }
    }
    return loadUsers().find(u => String(u.id) === targetId) || null;
  }

  async createUser({ name, email, password }) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if email already registered
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name: (name || '').trim(),
      email: normalizedEmail,
      password: hashedPassword,
      allergies: [],
      createdAt: new Date().toISOString()
    };

    // Save to MongoDB if connected
    if (isMongoConnected()) {
      try {
        await User.create(newUser);
      } catch (err) {
        console.warn('MongoDB create user error, saving to local file:', err.message);
      }
    }

    // Always keep local users.json in sync
    const users = loadUsers();
    users.push(newUser);
    saveUsers(users);

    return this.safeUser(newUser);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async addAllergy(userId, allergy) {
    const targetId = String(userId);
    const normalized = (allergy || '').trim();

    if (isMongoConnected()) {
      try {
        await User.updateOne({ id: targetId }, { $addToSet: { allergies: normalized } });
      } catch (err) {
        console.warn('MongoDB addAllergy error:', err.message);
      }
    }

    const users = loadUsers();
    const user = users.find(u => String(u.id) === targetId);
    if (user) {
      if (!user.allergies) user.allergies = [];
      if (!user.allergies.includes(normalized)) {
        user.allergies.push(normalized);
        saveUsers(users);
      }
      return this.safeUser(user);
    }

    const dbUser = await this.findById(userId);
    if (!dbUser) throw new Error('User not found');
    return this.safeUser(dbUser);
  }

  async removeAllergy(userId, allergy) {
    const targetId = String(userId);

    if (isMongoConnected()) {
      try {
        await User.updateOne({ id: targetId }, { $pull: { allergies: allergy } });
      } catch (err) {
        console.warn('MongoDB removeAllergy error:', err.message);
      }
    }

    const users = loadUsers();
    const user = users.find(u => String(u.id) === targetId);
    if (user) {
      if (user.allergies) {
        user.allergies = user.allergies.filter(a => a !== allergy);
        saveUsers(users);
      }
      return this.safeUser(user);
    }

    const dbUser = await this.findById(userId);
    if (!dbUser) throw new Error('User not found');
    return this.safeUser(dbUser);
  }

  async updateProfile(userId, updates) {
    const targetId = String(userId);

    if (isMongoConnected()) {
      try {
        await User.updateOne({ id: targetId }, { $set: updates });
      } catch (err) {
        console.warn('MongoDB updateProfile error:', err.message);
      }
    }

    const users = loadUsers();
    const user = users.find(u => String(u.id) === targetId);
    if (user) {
      if (updates.name) user.name = updates.name.trim();
      saveUsers(users);
      return this.safeUser(user);
    }

    const dbUser = await this.findById(userId);
    if (!dbUser) throw new Error('User not found');
    return this.safeUser(dbUser);
  }
}

module.exports = UserService;
