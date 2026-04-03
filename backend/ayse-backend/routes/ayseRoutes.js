const express = require('express');
const ayseController = require('../controllers/ayseController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.put(
  '/admin/venues/:id/hours',
  authMiddleware,
  adminMiddleware,
  ayseController.updateHours
);
router.put(
  '/admin/venues/:id/location',
  authMiddleware,
  adminMiddleware,
  ayseController.updateLocation
);
router.put(
  '/admin/venues/:id/menu',
  authMiddleware,
  adminMiddleware,
  ayseController.updateMenu
);

router.put('/auth/update-password', authMiddleware, ayseController.updatePassword);

router.post('/favorites', authMiddleware, ayseController.addFavorite);
router.delete('/favorites/:venueId', authMiddleware, ayseController.deleteFavorite);

router.post('/friends/request', authMiddleware, ayseController.sendFriendRequest);
router.get(
  '/notifications/friend-requests',
  authMiddleware,
  ayseController.getFriendRequests
);

module.exports = router;
