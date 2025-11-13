const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT (ahora incluye el rol)
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden registrar usuarios'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'operator',
      department
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Pasar el objeto de usuario completo para incluir el rol en el token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // El ID del usuario ahora viene directamente del token verificado por el gateway
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

exports.getAllUsers = async (req, res) => {
  console.log('--- Entering getAllUsers controller ---');
  try {
    const { role, department, isActive } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    console.log('Filter:', filter);

    const users = await User.find(filter).sort('-createdAt');
    console.log('Fetched users:', users);
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role, department, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, department, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const departmentStats = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: yesterday }
    });
    
    const byRole = {};
    roleStats.forEach(stat => {
      byRole[stat._id] = stat.count;
    });
    
    const byDepartment = {};
    departmentStats.forEach(stat => {
      byDepartment[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        byRole,
        byDepartment,
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};