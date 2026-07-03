const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    receiverId: String,
    senderId: String,
    type: String,
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);