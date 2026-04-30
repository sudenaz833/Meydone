const express = require('express');
const cerenController = require('../controllers/cerenController');
const authMiddleware = require('../../ayse-app/middleware/authMiddleware');

const router = express.Router();

router.post('/auth/login', cerenController.login);
router.post('/auth/register', cerenController.register);

router.get('/venues/search', cerenController.searchVenues);
router.get('/venues/filter', cerenController.filterVenues);

router.post('/comments', authMiddleware, cerenController.createComment);
router.post('/comments/:id/photo', authMiddleware, cerenController.addCommentPhoto);
router.delete('/comments/:id', authMiddleware, cerenController.deleteComment);
router.put('/comments/:id', authMiddleware, cerenController.updateComment);

router.get(
  '/notifications/comment-likes',
  authMiddleware,
  cerenController.getCommentLikeNotifications
);


module.exports = router;
