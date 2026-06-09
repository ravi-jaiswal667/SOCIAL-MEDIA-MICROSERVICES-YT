const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});


// hash password
userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    this.password = await argon2.hash(this.password);
});


// compare password
userSchema.methods.comparePassword = async function (candidatePassword) {

    return await argon2.verify(this.password, candidatePassword);
};


userSchema.index({ username: "text" });

module.exports = mongoose.model("User", userSchema);