const jwt = require('jsonwebtoken');

/**
 * JWT doğrulama: Authorization: Bearer <token>
 * Başarılıysa req.user = { id, role } atanır (payload: sub veya id, role).
 */
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Giriş gerekli' });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ message: 'Token eksik' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Sunucu yapılandırması eksik' });
    }

    const payload = jwt.verify(token, secret);
    const id = payload.sub ?? payload.id;
    if (id === undefined || id === null || id === '') {
      return res.status(401).json({ message: 'Geçersiz token içeriği' });
    }

    let role = 'user';
    if (payload.role === 'admin') role = 'admin';
    else if (payload.role === 'owner') role = 'owner';
    req.user = { id: String(id), role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Oturum süresi doldu' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Geçersiz token' });
    }
    return res.status(401).json({ message: 'Kimlik doğrulanamadı' });
  }
}

module.exports = authMiddleware;
