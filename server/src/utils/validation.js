// Phone number validation using E.164 format
const validatePhoneNumber = (phoneNumber) => {
    // Remove any non-digit characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US number (10 digits)
    if (cleanedNumber.length === 10) {
        // Format to E.164
        return `+1${cleanedNumber}`;
    }
    
    // Check if it's already in E.164 format (with country code)
    if (phoneNumber.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        return phoneNumber;
    }
    
    return false;
};

// Validate message content for Twilio
const validateMessage = (message) => {
    return {
        isValid: message && message.length <= 1600, // Twilio's character limit
        message: message || ''
    };
};

module.exports = {
    validatePhoneNumber,
    validateMessage
};