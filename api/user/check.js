import mongoose from 'mongoose';
import User from '../../server/src/models/User';

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
            .then((mongoose) => {
                return mongoose;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();
        
        const phoneNumber = req.query.phoneNumber;
        console.log('Checking phone number:', phoneNumber);
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Format phone number to E.164
        const cleaned = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

        // Check if user exists
        const user = await User.findOne({ phoneNumber: formattedNumber });
        console.log('User found:', user);
        
        res.status(200).json({ exists: !!user });
    } catch (error) {
        console.error('Phone check error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}