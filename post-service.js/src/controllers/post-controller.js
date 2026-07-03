const postModel = require("../models/post-model");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const User = require('../')
async function invalidateCache(req, input) {
    const post = `posts:${input}`;
    await req.redisClient.del(post);
    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
        await req.redisClient.del(...keys);
    }
}
const createPost = async (req, res) => {
    try {
        const user = req.user;
        console.log("user in post-controller", user);
        if (!user) {
            logger.warn("User not exists!!");
            return res.status(400).json({
                success: false,
                message: "User does not exists!!"
            })
        }
        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new postModel({
            userId: user,
            content,
            mediaIds: mediaIds || []
        })
        await newlyCreatedPost.save();
        await invalidateCache(req, newlyCreatedPost._id.toString());
        // publish the event to search service
        await publishEvent("post:created", {
            postId: newlyCreatedPost._id.toString(),
            userId: newlyCreatedPost.userId,
            content: newlyCreatedPost.content,
            createdAt: newlyCreatedPost.createdAt
        })
        res.status(200).json({
            success: true,
            message: "post created successFully!!"
        })
    } catch (error) {
        logger.error("Error while creating post!!");
        res.status(500).json({
            success: false,
            message: `Error while creating post!!, ${error}`
        })
    }
}
const getAllPost = async (req, res) => {
    try {
        // Implement pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const cachedKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cachedKey);
        if (cachedPosts) {
            return res.json(JSON.parse(cachedPosts));
        }
        const posts = await postModel.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
        const totalNoOfPosts = await postModel.countDocuments();
        const result = {
            posts,
            currentPage: page,
            totalPage: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts
        }
        // save your posts in redis cache
        await req.redisClient.setex(cachedKey, 300, JSON.stringify(result));
        res.json(result);

    } catch (error) {
        logger.error("Error while fetching posts!!");
        res.status(500).json({
            success: false,
            message: "Error while fetching posts!!"
        })
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cachedKey = `posts:${postId}`;
        const post = await req.redisClient.get(cachedKey);
        if (post) {
            return res.json(JSON.parse(post));
        }
        const singlePost = await postModel.findById(postId);
        await req.redisClient.setex(cachedKey, 3600, JSON.stringify(singlePost));
        res.json(singlePost);
    } catch (error) {
        logger.error("Error while fetching single post!!");
        res.status(500).json({
            success: false,
            message: "Error while fetching single post!!"
        })
    }
}

const deletePost = async (req, res) => {
    try {
        const post = await postModel.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
                success: false,
            });
        }
        // publish post delete method
        await publishEvent('post:deleted', {
            postId: post._id.toString(),
            userId: req.user,
            mediaId: post.mediaIds
        })
        await invalidateCache(req, req.params.id);
        res.json({
            message: "Post deleted successfully",
        });
    } catch (error) {
        logger.error("Error while deleting post!!");
        res.status(500).json({
            success: false,
            message: `Error while deleting post!!, ${error}`
        })
    }
}

const likePost = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user;
        const Post = await postModel.findById(id);
        if (!Post) {
            return res.status(400).json({
                success: false,
                message: "Post not found"
            })
        }
        // Prevent duplicate likes
        if (Post.likes.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: "Post already liked"
            });
        }
        Post.likes.push(userId);
        await Post.save();
        // publish the like event
        await publishEvent('post:liked', {
            postId: Post._id,
            postOwnerId: Post.userId,
            likedBy: userId
        })
        res.status(201).json({
            success: true,
            message: "Post liked successFully!!"
        })
    } catch (error) {
        logger.error("Error while like post!!");
        res.status(500).json({
            success: false,
            message: `Error while like post!!, ${error}`
        })
    }
}
const commentPost = async (req, res) => {
    try {
        const { comment } = req.body;
        const userId = req.user;
        const id = req.params.id;
        const post = await postModel.findById(id);
        if (!post) {
            return res.status(400).json({
                success: false,
                message: "Post not found"
            })
        }
        // prevent more than 2 comments on a post by any specific user
        const commentCount = post.comments.filter(ele =>
            ele.userId.toString() === userId
        ).length

        if (commentCount >= 2) {
            res.status(400).json({
                success: false,
                message: `User with userId ${userId} can not comment on this post more than twice`
            })
        }
        post.comments.push({ userId, text: comment });
        await post.save();
        // publish the comment event
        await publishEvent('post:comment', {
            postId: post._id,
            postOwnerId: post.userId,
            commentedBy: userId,
            comment: comment
        })
        res.status(201).json({
            success: true,
            message: "Post commented successFully!!"
        })
    } catch (error) {
        logger.error("Error while commenting post!!");
        res.status(500).json({
            success: false,
            message: `Error while commenting post!!, ${error}`
        })
    }
}
const getFeedPosts = async (req, res) => {
    try {
        const { followingIds } = req.body
        console.log("followingIds in post", followingIds);
        const posts = await postModel.find({
            userId: {
                $in: followingIds
            }
        }).sort({ createdAt: -1 })

        if (!posts) {
            return res.status(400).json({
                success: false,
                message: "No POST IS SUBSCRIBED BY ANY USER"
            })
        }
        res.status(201).json({
            success: true,
            posts
        })
    } catch (error) {
        logger.error("Error while getting Feed post!!", error);
        res.status(500).json({
            success: false,
            message: `Error while getting Feed post!!, ${error}`
        })
    }
}
const topLikedPosts = async (req, res) => {
    try {
        const howManyLikes = req.params.id;
        const allPosts = await postModel.find({});
        const top10LikedPosts = allPosts.aggregate([
            {
                $addFields: {
                    totalLikes: {
                        $size: "$likes"
                    }
                }
            },
            {
                $sort: { totalLikes: -1 }
            },
            {
                $limits: 10
            }
        ])
        res, status(201).json({
            success: true,
            top10LikedPosts
        })
    } catch (error) {
        logger.error("Error while getting  topLiked Posts!!", error);
        res.status(500).json({
            success: false,
            message: `Error while getting topLiked Posts!!, ${error}`
        })
    }
}

const hashTags = async (req, res) => {
    try {
        const tags = await postModel.aggregate([
            {
                $unwind: "$hashtags"
            },
            {
                $group: {
                    _id: "$hashtags",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ])
    } catch (error) {
        logger.error("Error while getting  hashTags Posts!!", error);
        res.status(500).json({
            success: false,
            message: `Error while getting hashTags Posts!!, ${error}`
        })
    }
}
const lookUpUse = async (req, res) => {
    try {
        const data = await postModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $project: {
                    "user.username": 1,
                    "user.email": 1,
                    content: 1
                }
            }
        ])
    } catch (error) {
        logger.error("Error while getting  lookUpUse!!", error);
        res.status(500).json({
            success: false,
            message: `Error while getting lookUpUse!!, ${error}`
        })
    }
}
module.exports = { createPost, getAllPost, getPost, deletePost, likePost, commentPost, getFeedPosts, topLikedPosts };
