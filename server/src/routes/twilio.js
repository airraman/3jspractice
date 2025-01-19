const express = require('express');
const router = express.Router();
const twilioClient = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
const User = require('../models/User');

router.post('/webhook', async (req, res) => {
    try {
        const { From, MessageStatus } = req.body;
        
        if (MessageStatus === 'unsubscribed') {
            await User.findOneAndUpdate(
                { phoneNumber: From },
                { twilioStatus: 'UNSUBSCRIBED' }
            );
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Twilio webhook error:', error);
        res.sendStatus(500);
    }
});

router.post('/send-message', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        const user = await User.findOne({ phoneNumber });
        if (!user || user.twilioStatus !== 'ACTIVE') {
            return res.status(400).json({ error: 'Cannot send message to this user' });
        }

        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        user.deliveryCount += 1;
        await user.save();

        res.json({ message: 'Message sent successfully', sid: twilioMessage.sid });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = { twilioRouter: router };