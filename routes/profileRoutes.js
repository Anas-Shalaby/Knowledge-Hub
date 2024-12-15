import express from 'express';
import Resource from '../models/resourceModel.js';
import Contribution from '../models/ContributionModel.js';
import User from '../models/userModel.js';
const router = express.Router();

// Get user profile details
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find user details
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's resources
    const resources = await Resource.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title subject topic createdAt rating ');
    // Get user's contributions and achievements
    const contributions = await Contribution.find({ userId: userId });

    // Calculate badge progression
    const badgeProgression = {
      'Rookie Uploader': {
        current: resources.length,
        threshold: 5,
        description: 'Upload 5 resources to become a Rookie Uploader'
      },
      'Resource Master': {
        current: resources.length,
        threshold: 20,
        description: 'Upload 20 resources to become a Resource Master'
      },
      'Knowledge Sharer': {
        current: contributions.filter(c => c.type === 'review').length,
        threshold: 10,
        description: 'Write 10 reviews to become a Knowledge Sharer'
      },
      'Helpful Reviewer': {
        current: contributions.filter(c => c.type === 'review' && c.rating >= 4).length,
        threshold: 5,
        description: 'Write 5 high-quality reviews to become a Helpful Reviewer'
      }
    };

    res.json({
      user: {
        username: user.username,
        email: user.email,
        level: user.level,
        totalPoints: user.totalPoints,
        badges: user.badges
      },
      resources,
      contributions,
      badgeProgression
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
