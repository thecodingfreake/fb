const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Completion = require('../models/Completeion'); 
// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register User
router.post('/signup', async (req, res) => {
    const { email, password, year, department } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = generateOTP();
        user = new User({ email, password, year, department, otp }); // Store the password directly

        await user.save();

        // Send OTP via emaill
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'jewwltest@gmail.com', // replace with your email
                pass: 'vtgzjrypgmxoqseo' // replace with your email password or app-specific password
            },
        });

        const mailOptions = {
            from: 'jewwltest@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP code is ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Error sending OTP' });
            } else {
                return res.status(200).json({ message: 'OTP sent', email });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        if (user.otp === otp) {
            user.isVerified = true;
            user.otp = null;
            await user.save();

            const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true });
            return res.status(200).json({ message: 'OTP verified', token });
        } else {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !user.isVerified) {
            return res.status(400).json({ message: 'Invalid credentials or user not verified' });
        }

        // Compare the provided password with the stored password
        const isMatch = user.password === password;

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Check or create completion entry
        const completionEntry = await Completion.findOne({ email });
        if (!completionEntry) {
            const newCompletion = new Completion({
                email: user.email,
                course_list: [] // Initialize as empty or set default values as needed
            });
            await newCompletion.save();
            console.log(`Completion entry created for user: ${user.email}`);
        }

        res.cookie('token', token, { httpOnly: true });
        res.status(200).json({ message: 'Logged in successfully', token, isAdmin: user.isAdmin, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
