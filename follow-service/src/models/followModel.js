const mongoose = require('mongoose');

const followSchema = mongoose.Schema({
    followerId: {
        type: String,
        required: true
    },
    followingId: {
        type: String,
        required: true
    }
}, { timeStamps: true });

module.exports = mongoose.model("Follow", followSchema);
