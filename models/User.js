const mongoose = require('mongoose');
 // Ensure you have bcryptjs installed

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    year: String,
    department: String,
    otp: String,
    otpExpiresAt: Date, // Field for OTP expiration
    isVerified: {
        type: Boolean,
        default: false,
    },
});

// Hash password before saving


module.exports = mongoose.model('User', userSchema);
