const Notification = require("../models/notificationModel");
const logger = require("../utils/logger");
const { intializeSocket, onlineUsers, getIO } = require('../socket/socket');

async function handlePostLikeEvent(msg) {
    try {
        // console.log('msg in notification', msg)
        // console.log('msg content in notification', msg)
        // const data = JSON.parse(msg.toString());
        const data = msg;
        console.log("notification msg", data);
        const likedPost = new Notification({
            receiverId: data.postOwnerId,
            senderId: data.likedBy,
            type: "LIKE",
            isRead: false
        });
        await likedPost.save();
        // Emit the event of post like by the user
        // console.log("onlineUsers");

        // console.log(onlineUsers);

        // console.log("receiver");

        // console.log(data.postOwnerId);

        // console.log("socketId");

        // console.log(
        //     onlineUsers.get(data.postOwnerId)
        // );
        const socketId = onlineUsers.get(data.postOwnerId);
        if (socketId) {
            // console.log("socketId in event-handler", socketId);
            getIO().to(socketId).emit("notification", likedPost)
        }
        logger.info(`LIKE notification created successfully`);
    } catch (err) {
        logger.error(`Error while Post like notification ${err}`);
    }
}
async function handlePostCommentEvent(msg) {
    try {
        const data = msg;
        console.log("notification msg of comment", data);
        // await publishEvent('post:comment', {
        //             postId: Post._id,
        //             postOwnerId: Post.userId,
        //             commentedBy: userId,
        //             comment: comment
        //         })
        const commentPost = new Notification({
            receiverId: data.postOwnerId,
            senderId: data.commentedBy,
            type: "COMMENT",
            isRead: false
        });
        await commentPost.save();
        const socketId = onlineUsers.get(data.postOwnerId);
        if (socketId) {
            getIO().to(socketId).emit("notification", commentPost)
        }
        logger.info(`COMMENT notification created successfully`);
    } catch (err) {
        logger.error(`Error while Post comment notification ${err}`);
    }
}
async function handleUserFollowEvent(msg) {
    try {
        const data = msg;
        console.log("notification msg of user follow", data);
        // await publishEvent('post:comment', {
        //             postId: Post._id,
        //             postOwnerId: Post.userId,
        //             commentedBy: userId,
        //             comment: comment
        //         })
        const commentPost = new Notification({
            receiverId: data.followerId,
            senderId: data.followingId,
            type: "FOLLOW",
            isRead: false
        });
        await commentPost.save();
        logger.info(`COMMENT notification created successfully`);
    } catch (err) {
        logger.error(`Error while User Follow notification ${err}`);
    }
}
module.exports = {
    handlePostLikeEvent, handlePostCommentEvent, handleUserFollowEvent
};