import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getFriendProfile,
  listFriends,
  listPendingFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', listFriends);
router.get('/pending', listPendingFriendRequests);

const sendRequestRules = [
  body().custom((_, { req }) => {
    const u = String(req.body?.username ?? '').trim();
    const f = String(req.body?.friendId ?? '').trim();
    if (!u && !f) {
      throw new Error('username or friendId is required');
    }
    if (u && f) {
      throw new Error('Send only username or friendId, not both');
    }
    if (f && !/^[a-f0-9]{24}$/i.test(f)) {
      throw new Error('friendId must be a valid id');
    }
    if (u) {
      if (u.length < 3 || u.length > 30) {
        throw new Error('username must be 3-30 chars');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(u)) {
        throw new Error('username may only contain letters, numbers and underscores');
      }
    }
    return true;
  }),
];

const friendRequestIdRule = param('id').isMongoId().withMessage('Invalid friend request id');
const friendUserIdRule = param('id').isMongoId().withMessage('Invalid user id');

const respondToRequestRules = [
  body('action')
    .optional()
    .isIn(['accept', 'reject'])
    .withMessage('action must be "accept" or "reject"'),
];

router.get('/profile/:id', friendUserIdRule, validate, getFriendProfile);
router.post('/request', sendRequestRules, validate, sendFriendRequest);
router.put(
  '/accept/:id',
  friendRequestIdRule,
  respondToRequestRules,
  validate,
  respondToFriendRequest,
);
router.delete('/:id', friendUserIdRule, validate, removeFriend);

export default router;
