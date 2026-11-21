import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage })

const videoUpload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'video/webm',
      'video/mp4',
      'video/quicktime',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported video format'));
    }

    cb(null, true);
  },
});

export { upload, videoUpload }