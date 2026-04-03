import { Router } from 'express';
import {
  listCommentLikeNotifications,
  listCommentReplyNotifications,
  listFriendRequestNotifications,
  listVenueAnnouncementNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/comment-likes', listCommentLikeNotifications);
router.get('/comment-replies', listCommentReplyNotifications);
router.get('/friend-requests', listFriendRequestNotifications);
router.get('/venue-announcements', listVenueAnnouncementNotifications);

export default router;
