const axios = require('axios');

const getFeed = async (req, res) => {
    try {
        const userId = req.user;
        let followingIds = null;
        const chachedKeyFollowingIds = `feedfollowingIds:${userId}`
        const result = await req.redisClient.get(chachedKeyFollowingIds);
        if (result) {
            followingIds = JSON.parse(result);
            console.log("followingIds from redis", followingIds)
        }
        else {
            const response = await axios.get(`${process.env.FOLLOW_SERVICE_URL}/api/follow/followings/${userId}`, {
                headers: {
                    "x-user-id": userId
                }
            });
            console.log("response.data", response.data);
            followingIds = response.data.followingIds;
        }
        req.redisClient.setex(chachedKeyFollowingIds, 300, JSON.stringify(followingIds));

        const cachedKeyPost = `feedPosts:${userId}`;
        let posts = null;
        const postResults = await req.redisClient.get(cachedKeyPost);
        if (postResults) {
            console.log("Feed Posts!!");
            posts = JSON.parse(postResults);
        }
        else {
            const postResponse = await axios.post(`${process.env.POST_SERVICE_URL}/api/post/feed`,
                {
                    followingIds
                },
                {
                    headers: {
                        "x-user-id": userId
                    }
                });
            posts = postResponse.data;
        }
        await req.redisClient.setex(cachedKeyPost, 300, JSON.stringify(posts))
        res.status(201).json({
            success: true,
            posts: posts
        })
    } catch (err) {
        console.log("error", err);
        console.log(err.response?.data);
        console.log(err.response?.status);
    }
}

module.exports = { getFeed };
