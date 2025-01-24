const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validatePhoneNumber } = require('../utils/validation');
const { generateToken } = require('../utils/auth');

router.post('/login', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        let user = await User.findOne({ phoneNumber });
        
        if (!user) {
            user = new User({ phoneNumber });
        }

        if (!user.canAccessContent()) {
            return res.status(403).json({ 
                error: 'Trial expired',
                message: 'Please subscribe to continue accessing content'
            });
        }

        await user.recordLogin();
        const token = generateToken(user);

        res.json({ 
            token,
            user: {
                phoneNumber: user.phoneNumber,
                subscription: user.subscription,
                trialUsageRemaining: user.trialUsageRemaining
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/subscribe', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const user = await User.findOne({ phoneNumber });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.subscription = true;
        await user.save();

        res.json({ message: 'Successfully subscribed', user });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/user/check/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        
        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        const user = await User.findOne({ phoneNumber });
        res.json({ exists: !!user });
    } catch (error) {
        console.error('Phone check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = { userRouter: router };