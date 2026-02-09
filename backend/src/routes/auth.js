const express = require('express');
const { body } = require('express-validator');
const { register, login, me, verifyEmail, resendVerification } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

router.get('/me', auth, me);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', auth, resendVerification);

module.exports = router;
