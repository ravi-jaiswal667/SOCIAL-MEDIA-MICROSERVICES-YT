const Notification = require('../models/notificationModel')

const getNotifications = async (req, res) => {
    try {
        const userId = req.user;
        // console.log('userId', userId);
        const notification = await Notification.find({ receiverId: userId });
        if (!notification) {
            return res.status(400).json({
                success: false,
                message: "No Notification found, User needs to like or comment the post first"
            })
        }
        res.status(201).json({
            success: true,
            notification
        })
    } catch (e) {
        res.status(500).json({
            success: false,
            message: "Failed to get Notifications", e
        })
    }
}
module.exports = { getNotifications }