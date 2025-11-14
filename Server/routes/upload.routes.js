const express = require('express');
const { checkJwt } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const uploadController = require('../controllers/upload.controller');

const router = express.Router();

// File upload endpoint - protected with Auth0 and rate limited
router.post('/', uploadLimiter, checkJwt, upload.single('file'), uploadController.uploadFile);

// Upload from URL endpoint - protected with Auth0 and rate limited
router.post('/from-url', uploadLimiter, checkJwt, uploadController.uploadFromUrl);

module.exports = router;
