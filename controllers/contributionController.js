import Contribution from '../models/ContributionModel.js';

const getLeaderboard = async (req, res) => {
  try {
    // Get top contributors sorted by total points
    const leaderboard = await Contribution.aggregate([
      {
        $lookup: {
          from: 'users', // Assuming your users collection is named 'users'
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          username: '$userDetails.name',
          userId: '$userDetails._id',
          email: '$userDetails.email',
          totalPoints: 1,
          resourcesUploaded: 1,
          resourcesDownloaded: 1,
          reviewsWritten: 1,
          badges: 1,
          level: 1
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 50 } // Top 50 contributors
    ]);

    res.status(200).json({
      status: 'success',
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
};

const updateContribution = async (userId, action) => {
  try {
    // Find or create contribution record
    let contribution = await Contribution.findOne({ user: userId });
    
    if (!contribution) {
      contribution = new Contribution({ user: userId });
    }

    // Update contribution based on action
    switch(action) {
      case 'resourceUpload':
        contribution.resourcesUploaded += 1;
        break;
      case 'resourceDownload':
        contribution.resourcesDownloaded += 1;
        break;
      case 'reviewWritten':
        contribution.reviewsWritten += 1;
        break;
    }

    // Recalculate points and level
    contribution.calculatePoints();
    
    await contribution.save();
    return contribution;
  } catch (error) {
    console.error('Error updating contribution:', error);
    throw error;
  }
};

const getUserContribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const contribution = await Contribution.findOne({ user: userId });

    if (!contribution) {
      return res.status(404).json({
        status: 'error',
        message: 'No contribution record found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: contribution
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user contribution',
      error: error.message
    });
  }
};

export { getLeaderboard, updateContribution, getUserContribution };