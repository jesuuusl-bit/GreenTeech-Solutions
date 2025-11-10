const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador');
      console.log('Email:', existingAdmin.email);
      process.exit(0);
    }

    // Crear usuario administrador
    const adminUser = await User.create({
      name: 'Administrador',
      email: 'admin@greentech.com',
      password: 'admin123',
      role: 'admin',
      department: 'management',
      isActive: true
    });

    console.log('✅ Usuario administrador creado exitosamente!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();