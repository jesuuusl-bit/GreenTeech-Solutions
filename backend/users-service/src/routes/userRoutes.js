// ===== backend/users-service/src/routes/userRoutes.js =====
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/register', protect, restrictTo('admin'), register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/', protect, restrictTo('admin', 'manager'), getAllUsers);
router.put('/:id', protect, restrictTo('admin'), updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;
