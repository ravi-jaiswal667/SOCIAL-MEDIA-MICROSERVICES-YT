const postModel = require("../models/post-model");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
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

module.exports = { createPost, getAllPost, getPost, deletePost };
