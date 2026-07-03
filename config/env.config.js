require('dotenv').config();

module.exports = {
  groqApiKey: process.env.GROQ_API_KEY,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'medvision-dev-secret-change-in-production',
  mongoUri: process.env.MONGO_URI
};
