const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: 'Carlos Rodríguez',
    email: 'carlos.manager@greentech.com',
    password: 'manager123',
    role: 'manager',
    department: 'management'
  },
  {
    name: 'Ana García',
    email: 'ana.operator@greentech.com',
    password: 'operator123',
    role: 'operator',
    department: 'operations'
  },
  {
    name: 'Luis Martínez',
    email: 'luis.technician@greentech.com',
    password: 'tech123',
    role: 'technician',
    department: 'maintenance'
  },
  {
    name: 'María López',
    email: 'maria.analyst@greentech.com',
    password: 'analyst123',
    role: 'analyst',
    department: 'engineering'
  },
  {
    name: 'Pedro Sánchez',
    email: 'pedro.auditor@greentech.com',
    password: 'auditor123',
    role: 'auditor',
    department: 'legal'
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar usuarios de prueba existentes
    await User.deleteMany({ 
      email: { $in: sampleUsers.map(u => u.email) } 
    });

    // Crear usuarios de prueba
    const createdUsers = await User.create(sampleUsers);
    
    console.log(`✅ ${createdUsers.length} usuarios de prueba creados:\n`);
    createdUsers.forEach(user => {
      console.log(`  👤 ${user.name}`);
      console.log(`     📧 ${user.email}`);
      console.log(`     🏷️  ${user.role} - ${user.department}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedUsers();