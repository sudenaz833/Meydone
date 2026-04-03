import multer from 'multer';

const maxBytes = 5 * 1024 * 1024;

export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
});
