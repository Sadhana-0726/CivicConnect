const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/jwt');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

const VALID_ROLES = ['citizen', 'department_officer', 'department_admin', 'super_admin'];
const VALID_DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Solid Waste',
  'Water & Sewage',
  'Electrical & Streetlights',
  'Public Safety & General',
];

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '30d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, staffKey } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields (name, email, password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const targetRole = role ? String(role).trim() : 'citizen';

    // 1. Role validation
    if (!VALID_ROLES.includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role "${targetRole}". Must be one of: ${VALID_ROLES.join(', ')}`,
      });
    }

    // 2. Strict controlled access check for privileged roles
    const configuredStaffKey = process.env.STAFF_REGISTRATION_KEY;
    const providedStaffKey = staffKey || req.headers['x-staff-key'];
    const hasValidStaffKey = Boolean(
      configuredStaffKey && providedStaffKey && providedStaffKey === configuredStaffKey
    );

    let assignedDepartment = null;

    if (targetRole !== 'citizen') {
      if (!hasValidStaffKey) {
        return res.status(403).json({
          success: false,
          message: `Public registration as ${targetRole} is restricted. Valid staff authorization key is required.`,
        });
      }

      if (targetRole === 'department_officer' || targetRole === 'department_admin') {
        if (!department || !VALID_DEPARTMENTS.includes(department)) {
          return res.status(400).json({
            success: false,
            message: `Department is required for municipal staff. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
          });
        }
        assignedDepartment = department;
      }
    }

    // 3. Duplicate check
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists. Please Sign In instead.' });
    }

    // 4. Create user
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: targetRole,
      department: assignedDepartment,
    });

    return res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// GET /api/auth/me (Current user session)
router.get('/me', protect, async (req, res) => {
  return res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      roleMeta: req.user.roleMeta,
    },
  });
});

// GET /api/auth/officers (Fetch staff officers, optional filter: ?department=)
router.get(
  '/officers',
  protect,
  restrictTo('department_admin', 'super_admin'),
  async (req, res, next) => {
    try {
      const filter = {
        role: { $in: ['department_officer', 'department_admin'] },
      };
      if (req.user.role === 'department_admin' && req.user.department) {
        filter.department = req.user.department;
      } else if (req.query.department) {
        filter.department = req.query.department;
      }

      const officers = await User.find(filter).select('name email role department');
      res.json(officers);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
