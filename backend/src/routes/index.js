import { Router } from 'express';
import userRoutes from './userRoutes.js';
import venueRoutes from './venueRoutes.js';
import commentRoutes from './commentRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import friendRoutes from './friendRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import postRoutes from './postRoutes.js';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/venues', venueRoutes);
router.use('/comments', commentRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/friends', friendRoutes);
router.use('/notifications', notificationRoutes);
router.use('/posts', postRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

export default router;
