// ===== backend/users-service/src/routes/userRoutes.js =====
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  getAllUsers, 
  updateUser, 
  deleteUser,
  toggleUserStatus,
  getUserStats
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/stats', protect, restrictTo('admin', 'manager'), getUserStats);
router.get('/', protect, restrictTo('admin', 'manager'), getAllUsers);
router.put('/:id', protect, restrictTo('admin'), updateUser);
router.patch('/:id/status', protect, restrictTo('admin'), toggleUserStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;
