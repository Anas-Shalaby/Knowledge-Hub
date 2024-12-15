import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourcesUploaded: {
    type: Number,
    default: 0
  },
  resourcesDownloaded: {
    type: Number,
    default: 0
  },
  reviewsWritten: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  level: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

// Points calculation rules
contributionSchema.methods.calculatePoints = function() {
  // Resource upload: 10 points
  // Resource download: 2 points
  // Review written: 5 points
  this.totalPoints = 
    (this.resourcesUploaded * 10) + 
    (this.resourcesDownloaded * 2) + 
    (this.reviewsWritten * 5);

  // Level calculation
  this.level = Math.floor(Math.sqrt(this.totalPoints / 50)) + 1;

  // Badge assignment
  this.badges = [];
  if (this.resourcesUploaded >= 1) this.badges.push('Rookie Uploader');
  if (this.resourcesUploaded >= 5) this.badges.push('Resource Master');
  if (this.resourcesUploaded >= 10) this.badges.push('Knowledge Sharer');
  if (this.reviewsWritten >= 3) this.badges.push('Helpful Reviewer');
  
  return this;
};

const Contribution = mongoose.model('Contribution', contributionSchema);

export default Contribution;