const Follow = require('../models/followModel');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitMQ');

// follow the user
const followTheUser = async (req, res) => {
    try {
        const followerId = req.user;
        const followingId = req.params.id;
        if (followerId === followingId) {
            return res.status(400).json({
                success: false,
                message: `User with followerId ${followerId} can not follow himself ${followingId}`
            })
        }
        const existingFollow = await Follow.findOne({ followerId, followingId });
        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: "Already following user"
            });
        }

        const follow = new Follow({
            followerId, followingId
        })
        await follow.save();
        // invalidateCache
        await req.redisClient.del(`feedfollowingIds:${followerId}`);
        await req.redisClient.del(`feedPosts:${followerId}`);
        publishEvent("user:follow", {
            followerId, followingId
        })
        res.status(201).json({
            success: true,
            followUser: follow
        })
    } catch (err) {
        logger.error(`Error occurred when user follows ${err}`);
        res.status(500).json({
            success: false,
            message: `Error occurred when user follows ${err}`
        })
    }
}

// Unfollow the User
const unfollowTheUser = async (req, res) => {
    try {
        const followerId = req.user;
        const followingId = req.params.id;

        const deleted = await Follow.findOneAndDelete({
            followerId,
            followingId
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Follow relationship not found"
            });
        }
        await req.redisClient.del(`feedfollowingIds:${followerId}`);
        await req.redisClient.del(`feedPosts:${followerId}`);
        res.status(200).json({
            success: true,
            deleted
        })
    } catch (err) {
        logger.error(`Error occurred when user UnFollows ${err}`);
        res.status(500).json({
            success: false,
            message: `Error occurred when user UnFollows ${err}`
        })
    }
}

const getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;
        const followings = await Follow.find({ followerId: userId });
        if (!followings) {
            return res.status(400).json({
                success: false,
                message: "Failed to get followings"
            })
        }
        const followingIds = followings.map(item => item.followingId);
        res.status(201).json({
            success: true,
            followingIds
        })
    } catch (err) {
        logger.error(`Error occurred when tried to get Following ${err}`);
        res.status(500).json({
            success: false,
            message: `Error occurred when tried to get Following ${err}`
        })
    }
}

const topUsersByFollowers = async (req, res) => {
    try {
        const data = await Follow.aggregate([
            {
                $group: {
                    _id: "$followingId",
                    totalFollowers: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    totalFollowers: -1
                }
            },
            {
                $limit: 10
            }
        ]);
        res.status(201).json({
            success: true,
            ToUsersByFollowers: data
        })
    }
    catch (err) {
        logger.error(`Error occurred when tried to get topUsersByFollowers ${err}`);
        res.status(500).json({
            success: false,
            message: `Error occurred when tried to get topUsersByFollowers ${err}`
        })
    }
}

module.exports = { followTheUser, unfollowTheUser, getFollowing, topUsersByFollowers };