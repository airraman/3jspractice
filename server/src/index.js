const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { twilioRouter } = require('./routes/twilio');
const { userRouter } = require('./routes/users');
const { authMiddleware } = require('./middleware/auth');
const app = express();

dotenv.config();


const allowedOrigins = [
    'http://localhost:5173',    // Local Vite development server
    'https://songmap.io',       // Your main production domain
    'https://www.songmap.io'    // Include www subdomain for completeness
];

const corsOptions = {
    origin: function(origin, callback) {
      // During development, browser tools and local requests might not send an origin
      // This check ensures those requests still work while you're developing
      if (!origin) {
        return callback(null, true);
      }
  
      // Check if the requesting origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        // Allow the request by calling callback with null for error and true for success
        callback(null, true);
      } else {
        // If the origin isn't in our list, deny the request
        callback(new Error(`Access blocked by CORS policy - Origin ${origin} not allowed`));
      }
    },
    credentials: true,  // This enables authenticated requests to work properly
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Explicitly state allowed methods
    allowedHeaders: ['Content-Type', 'Authorization']      // Explicitly state allowed headers
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
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/twilio', twilioRouter);
app.use('/api/user', userRouter);

// Protected routes
app.use('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: 'Access granted', user: req.user });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});