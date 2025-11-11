// ===== backend/users-service/src/routes/setupRoutes.js =====
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Endpoint para crear el primer admin (sin autenticación)
router.post('/create-first-admin', async (req, res) => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario administrador. Este endpoint está deshabilitado.',
        note: 'Usa /api/users/login para autenticarte'
      });
    }

    const { name, email, password } = req.body;

    // Validaciones básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Crear el primer admin
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      department: 'management',
      isActive: true
    });

    console.log('✅ Primer administrador creado:', admin.email);

    res.status(201).json({
      success: true,
      message: '✅ Usuario administrador creado exitosamente',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department
      },
      note: '⚠️ IMPORTANTE: Este endpoint se deshabilitará automáticamente después del primer admin'
    });
  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    
    // Error de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear administrador',
      error: error.message
    });
  }
});

// Endpoint para verificar si existe un admin
router.get('/has-admin', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    res.status(200).json({
      success: true,
      hasAdmin: adminCount > 0,
      adminCount: adminCount,
      message: adminCount > 0 
        ? 'Ya existe al menos un administrador' 
        : 'No hay administradores registrados. Usa /api/setup/create-first-admin'
    });
  } catch (error) {
    console.error('❌ Error al verificar admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar administradores',
      error: error.message
    });
  }
});

// Endpoint para verificar el estado del servicio
router.get('/status', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        adminCount,
        activeUsers,
        setupComplete: adminCount > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado',
      error: error.message
    });
  }
});

module.exports = router;