const express = require('express');
const sudeController = require('../controllers/sudeController');
const authMiddleware = require('../../ayse-app/middleware/authMiddleware');

const router = express.Router();

router.delete('/admin/venues/:venuesId', authMiddleware, sudeController.deleteVenue);
router.post('/admin/register', sudeController.adminRegister);

router.get('/venues/sort', sudeController.sortVenuesByRating);
router.post('/venues/:id/rate', authMiddleware, sudeController.rateVenue);
router.get('/venues/:id/average-rating', sudeController.getAverageRating);

router.delete('/users/account', authMiddleware, sudeController.deleteUserAccount);
router.put('/users/profile', authMiddleware, sudeController.updateUserProfile);
router.post('/users/posts', authMiddleware, sudeController.createPost);

module.exports = router;
