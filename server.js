const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/env.config');
const medicineRoutes = require('./routes/medicine.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Medicine Information Engine API',
    endpoints: {
      getMedicineInfo: 'GET /api/medicine/info?name=<medicine_name>'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/medicine', medicineRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal server error',
    disclaimer: 'This system provides informational purposes only. It does not provide medical advice.'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

const PORT = config.port;

// Start Express server immediately to satisfy Render health checks
app.listen(PORT, () => {
  console.log(`Medicine Info Engine running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Connect to MongoDB in the background
if (!config.mongoUri) {
  console.error('WARNING: MONGO_URI environment variable is not defined!');
} else {
  mongoose.connect(config.mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch(err => {
      console.error('MongoDB connection failed:', err.message);
      console.error('The server will continue running, but database features may be unavailable.');
    });
}

module.exports = app;
