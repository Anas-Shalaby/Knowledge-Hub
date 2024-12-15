import asyncHandler from 'express-async-handler';
import Resource from '../models/resourceModel.js';
import Contribution from '../models/ContributionModel.js';

const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's uploaded resources
  const uploadedResources = await Resource.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title subject topic createdAt');

  // Get recommended resources based on user's subject interests
  const userContribution = await Contribution.findOne({ user: userId });
  const recommendedResources = userContribution ? 
    await Resource.find({ 
      subject: { $in: userContribution.topSubjects || [] },
      user: { $ne: userId }
    })
    .sort({ averageRating: -1 })
    .limit(5)
    .populate('user', 'name')
    .select('title subject topic averageRating user') 
    : [];

  // Get user's recent activity
  const recentActivity = [
    ...(uploadedResources.map(resource => ({
      type: 'upload',
      title: resource.title,
      date: resource.createdAt
    }))),
    // You can add more activity types like downloads, reviews, etc.
  ].sort((a, b) => b.date - a.date).slice(0, 5);

  // Get user's contribution stats
  const contributionStats = await Contribution.findOne({ user: userId }) || {
    resourcesUploaded: 0,
    resourcesDownloaded: 0,
    reviewsWritten: 0,
    totalPoints: 0,
    level: 1
  };

  res.json({
    uploadedResources,
    recommendedResources,
    recentActivity,
    contributionStats
  });
});

export { getDashboardData };
