const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        default: null
    },
    last_name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    password: {
        type: String,
        default: null
    },

    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        default: null
    }],
    walletBalance: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ["Public", "Farmer"],
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    }, // OTP Verification
})

module.exports = mongoose.model("User", UserSchema)