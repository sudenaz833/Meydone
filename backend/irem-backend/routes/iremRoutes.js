const express = require('express');
const iremController = require('../controllers/iremController');
const authMiddleware = require('../../ayse-app/middleware/authMiddleware');
const adminMiddleware = require('../../ayse-app/middleware/adminMiddleware');
const multerVenuePhoto = require('../middleware/multerVenuePhoto');

const router = express.Router();

router.put('/friends/accept/:id', authMiddleware, iremController.acceptFriendRequest);
router.delete('/friends/:id', authMiddleware, iremController.deleteFriend);
router.get('/friends', authMiddleware, iremController.getFriends);

router.get('/venues/nearby', iremController.getNearbyVenues);
router.get('/venues/map', iremController.getVenuesMap);

router.post('/users/privacy', authMiddleware, iremController.updatePrivacy);
router.post('/comments/:id/like', authMiddleware, iremController.likeComment);

router.post(
  '/admin/venues/:id/photo',
  authMiddleware,
  adminMiddleware,
  multerVenuePhoto,
  iremController.uploadVenuePhoto
);

module.exports = router;
