import mongoose from 'mongoose';

// Define User Schema here instead of importing
const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\+[1-9]\d{1,14}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    loginCount: {
        type: Number,
        default: 0
    },
    deliveryCount: {
        type: Number,
        default: 0
    },
    subscription: {
        type: Boolean,
        default: false
    },
    engagementRate: {
        type: Number,
        default: 0
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    twilioStatus: {
        type: String,
        enum: ['ACTIVE', 'UNSUBSCRIBED', 'BLOCKED'],
        default: 'ACTIVE'
    },
    trialUsageRemaining: {
        type: Number,
        default: 4
    }
}, {
    timestamps: true
});

// Only create model if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);

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
        console.log('Connecting to database...');
        await connectToDatabase();
        console.log('Database connected');
        
        const phoneNumber = req.query.phoneNumber;
        console.log('Checking phone number:', phoneNumber);
        
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Format phone number to E.164
        const cleaned = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
        console.log('Formatted number:', formattedNumber);

        // Check if user exists
        const user = await User.findOne({ phoneNumber: formattedNumber });
        console.log('User found:', user);
        
        res.status(200).json({ exists: !!user });
    } catch (error) {
        console.error('Phone check error:', error);
        res.status(500).json({ 
            error: 'Server error',
            details: error.message 
        });
    }
}