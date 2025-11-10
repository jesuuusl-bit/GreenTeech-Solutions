// ===== backend/users-service/src/config/database.js =====
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB conectado - Users Service');
  } catch (error) {
    console.error('❌ Error de conexión MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;