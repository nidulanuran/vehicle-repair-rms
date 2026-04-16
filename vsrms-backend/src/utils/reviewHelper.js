'use strict';

const mongoose = require('mongoose');
const Review = require('../models/Review');
const Workshop = require('../models/Workshop');

/**
 * Recalculate and persist averageRating + totalReviews on the Workshop document.
 * Called after every review POST, PUT, or DELETE.
 *
 * Uses a single aggregation — acceptable on M0 free tier (one write per user action).
 */
const recalculateRating = async (workshopId) => {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const result = await Review.aggregate([
    { $match: { workshopId: new mongoose.Types.ObjectId(workshopId) } },
    {
      $addFields: {
        weight: {
          $cond: {
            if: { $gte: ['$createdAt', sixtyDaysAgo] },
            then: 1.0,
            else: 0.5,
          },
        },
      },
    },
    {
      $group: {
        _id:         '$workshopId',
        weightedSum: { $sum: { $multiply: ['$rating', '$weight'] } },
        totalWeight: { $sum: '$weight' },
        totalCount:  { $sum: 1 },
      },
    },
    {
      $project: {
        avg:   { $divide: ['$weightedSum', '$totalWeight'] },
        count: '$totalCount',
      },
    },
  ]);

  const avg   = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length ? result[0].count : 0;

  await Workshop.findByIdAndUpdate(workshopId, { averageRating: avg, totalReviews: count });
};

module.exports = { recalculateRating };
