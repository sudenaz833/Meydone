/**
 * authMiddleware sonrası kullanın. Sadece req.user.role === 'admin' ise devam eder.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için yönetici yetkisi gerekli' });
  }
  next();
}

module.exports = adminMiddleware;
