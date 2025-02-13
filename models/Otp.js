const mongoose = require("mongoose")

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        default: null
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",

    },

    otp: {
        type: Number,
        default: null
    },
    expiresAt: {
        type: Date,
        required:
            true
    },
    verified: {
        type: Boolean,
        default: false
    },

}, { timestamps: true })

module.exports = mongoose.model("Otp", OtpSchema)