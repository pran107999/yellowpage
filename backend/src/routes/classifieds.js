const express = require('express');
const { body } = require('express-validator');
const {
  getClassifieds,
  getClassified,
  createClassified,
  getMyClassifieds,
  updateClassified,
  deleteClassified,
} = require('../controllers/classifiedController');
const { auth, requireVerifiedEmail } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getClassifieds);
router.get('/my', auth, getMyClassifieds);
router.get('/:id', getClassified);

// Protected routes (require login + verified email to create/update/delete)
router.post(
  '/',
  auth,
  requireVerifiedEmail,
  [
    body('title').trim().notEmpty().isLength({ max: 500 }),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('visibility').optional().isIn(['all_cities', 'selected_cities']),
  ],
  createClassified
);

router.put(
  '/:id',
  auth,
  requireVerifiedEmail,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 500 }),
    body('description').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('status').optional().isIn(['draft', 'published']),
    body('visibility').optional().isIn(['all_cities', 'selected_cities']),
  ],
  updateClassified
);

router.delete('/:id', auth, requireVerifiedEmail, deleteClassified);

module.exports = router;
