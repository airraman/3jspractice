import { connectToDatabase } from '../../server/src/utils/mongodb';
import User from '../../server/src/models/User';
import { generateToken } from '../../server/src/utils/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phoneNumber } = req.body;
        
        // Format phone number to E.164
        const cleaned = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

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
}