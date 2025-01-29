const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validatePhoneNumber } = require('../utils/validation');
const { generateToken } = require('../utils/auth');

// Helper function to format phone number to E.164
function formatToE164(phoneNumber) {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Add the '+1' prefix for US numbers if not present
    return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
}

router.post('/login', async (req, res) => {
    try {
        const formattedNumber = formatToE164(req.body.phoneNumber);
        
        if (!validatePhoneNumber(formattedNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        let user = await User.findOne({ phoneNumber: formattedNumber });
        
        if (!user) {
            user = new User({ phoneNumber: formattedNumber });
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
        const formattedNumber = formatToE164(req.body.phoneNumber);
        const user = await User.findOne({ phoneNumber: formattedNumber });
        
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

router.get('/check/:phoneNumber', async (req, res) => {
    try {
        const formattedNumber = formatToE164(req.params.phoneNumber);
        console.log('Checking phone number:', formattedNumber);
        
        if (!validatePhoneNumber(formattedNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        const user = await User.findOne({ phoneNumber: formattedNumber });
        console.log('User found:', user);
        res.json({ exists: !!user });
    } catch (error) {
        console.error('Phone check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = { userRouter: router };