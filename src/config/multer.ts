import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage })

const videoUpload = multer({
  storage: storage,

  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
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

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 150 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, callback) => {
    // const allowedTypes = [
    //   'audio/webm',
    //   'audio/mp4',
    //   'audio/mpeg',
    //   'audio/ogg',
    //   'audio/wav',
    //   'audio/x-wav',
    // ];

    // if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
    // } else {
    //   callback(new Error(`Unsupported audio format: ${file.mimetype}`));
    // }
  },
});

export { upload, videoUpload, audioUpload }