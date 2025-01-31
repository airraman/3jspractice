const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { twilioRouter } = require('./routes/twilio');
const { userRouter } = require('./routes/users');
const { authMiddleware } = require('./middleware/auth');

const app = express();
dotenv.config();

// Security middleware with specific CSP for songmap.io
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "songmap.io", "*.songmap.io"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "songmap.io", "*.songmap.io"],
            styleSrc: ["'self'", "'unsafe-inline'", "songmap.io", "*.songmap.io"],
            imgSrc: ["'self'", "data:", "blob:", "songmap.io", "*.songmap.io"],
            connectSrc: ["'self'", "songmap.io", "*.songmap.io", "mongodb.com", "*.mongodb.com"],
            fontSrc: ["'self'", "data:", "songmap.io", "*.songmap.io"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "songmap.io", "*.songmap.io"],
            frameSrc: ["'none'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

const allowedOrigins = [
    'http://localhost:5173',      // Local development
    'https://songmap.io',         // Production
    'https://www.songmap.io'      // Production with www
];

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Access blocked by CORS policy - Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Routes
app.use('/api/twilio', twilioRouter);
app.use('/api/user', userRouter);
app.use('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: 'Access granted', user: req.user });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Application available at https://songmap.io`);
});