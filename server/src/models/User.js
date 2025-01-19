const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
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

userSchema.pre('save', function(next) {
    if (this.deliveryCount > 0) {
        this.engagementRate = (this.loginCount / this.deliveryCount) * 100;
    }
    next();
});

userSchema.methods.canAccessContent = function() {
    return this.subscription || this.trialUsageRemaining > 0;
};

userSchema.methods.recordLogin = async function() {
    this.loginCount += 1;
    this.lastLogin = new Date();
    if (!this.subscription) {
        this.trialUsageRemaining = Math.max(0, this.trialUsageRemaining - 1);
    }
    await this.save();
};

module.exports = mongoose.model('User', userSchema);