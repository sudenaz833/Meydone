import { AppError } from '../utils/AppError.js';

const formatMongooseError = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] ?? 'field';
    if (field === 'email') {
      return new AppError('Bu e-posta zaten kayıtlı.', 409);
    }
    if (field === 'username') {
      return new AppError('Bu kullanıcı adı zaten alınmış.', 409);
    }
    return new AppError('Bu değer zaten kullanımda.', 409);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return new AppError(messages.join('. ') || 'Doğrulama başarısız.', 400);
  }
  if (err.name === 'CastError') {
    return new AppError('Geçersiz kimlik formatı.', 400);
  }
  return null;
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const mongooseMapped = formatMongooseError(err);
    if (mongooseMapped) {
      error = mongooseMapped;
    } else if (err.name === 'JsonWebTokenError') {
      error = new AppError('Geçersiz token.', 401);
    } else if (err.name === 'TokenExpiredError') {
      error = new AppError('Oturum süresi doldu. Lütfen tekrar giriş yapın.', 401);
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('Dosya en fazla 5 MB olabilir.', 400);
    } else {
      error = new AppError(
        process.env.NODE_ENV === 'production' ? 'Sunucu hatası oluştu.' : err.message,
        err.statusCode || 500,
        false,
      );
    }
  }

  const statusCode = error.statusCode ?? 500;
  const payload = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV !== 'production' && error.stack
      ? { stack: error.stack }
      : {}),
  };

  res.status(statusCode).json(payload);
};

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
