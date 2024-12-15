import express from 'express';
import { getLeaderboard , getUserContribution } from '../controllers/contributionController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/my-contribution', protect, getUserContribution);

export default router;