import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage })

const videoUpload = multer({
  storage: storage,

  limits: {
    fileSize: 300 * 1024 * 1024, // 100 MB
  },

  fileFilter: (req, file, callback) => {
    console.log('========== VIDEO UPLOAD DEBUG ==========');
    console.log('Original filename:', file.originalname);
    console.log('MIME type:', file.mimetype);
    console.log('Field name:', file.fieldname);
    console.log('Encoding:', file.encoding);
    console.log('========================================');

    // Temporarily accept the upload so we can inspect it.
    callback(null, true);
  },
});

export { upload, videoUpload }