const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const jwt = require('jsonwebtoken'); 
const jwtSecret = process.env.JWT_SECRET 

const Role = require('../model/role');
const authenticateToken = require("../middleware/adminMiddleware")



router.post('/admin-login', async (req, res) => {
    try {
      const { email, password } = req.body;
   
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Only admins can login.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Create JWT token
      const payload = {
        id: user._id,
        role: user.role,
      };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '2d' });
      res.status(200).json(token);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });


router.get('/permissions', authenticateToken, async (req, res) => {
    try {
      const { role } = req.user; 
      const roleData = await Role.findById(role);
      if (!roleData) {
        return res.status(404).json({ message: 'Role not found' });
      }
      res.status(200).json(roleData.permissions);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });






module.exports = router;
