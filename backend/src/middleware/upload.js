const multer = require('multer');
const path = require('path');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.match(ALLOWED_TYPES)) {
    return cb(new Error('Only images (JPEG, PNG, GIF, WebP) are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
});

/** Multer middleware for classified image uploads (field: images) */
const classifiedImagesUpload = upload.fields([{ name: 'images', maxCount: 10 }]);

module.exports = { classifiedImagesUpload, MAX_FILE_SIZE };
