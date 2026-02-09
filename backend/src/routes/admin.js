const express = require('express');
const { body } = require('express-validator');
const {
  getStats,
  getAllUsers,
  getAllClassifieds,
  updateClassifiedStatus,
  deleteClassifiedAdmin,
  createCity,
  deleteCity,
  updateUserRole,
} = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/classifieds', getAllClassifieds);
router.put('/classifieds/:id/status', updateClassifiedStatus);
router.delete('/classifieds/:id', deleteClassifiedAdmin);
router.post(
  '/cities',
  [body('name').trim().notEmpty(), body('state').trim().notEmpty()],
  createCity
);
router.delete('/cities/:id', deleteCity);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
