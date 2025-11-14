const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, EPUB, and TXT files
    const allowedMimeTypes = [
      'application/pdf',
      'application/epub+zip',
      'text/plain'
    ];
    
    const extension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'epub', 'txt'];
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, EPUB, and TXT files are allowed'), false);
    }
  }
});

module.exports = { upload };
