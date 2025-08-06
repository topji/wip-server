const mongoose = require('mongoose');

// Define ownership schema for multiple owners
const ownershipSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, { _id: false });

// Define update schema for tracking file updates
const updateSchema = new mongoose.Schema({
    fileHash: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    transactionHash: {
        type: String,
        required: true
    }
}, { _id: false });

const certificateDataSchema = new mongoose.Schema({
    certificateId: {
        type: Number,
        required: true,
        unique: true
    },
    fileHash: {
        type: String,
        required: true
    },
    metadataURI: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    fileFormat: {
        type: String,
        required: true,
        // enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'] // Add more formats as needed
    },
    timestamp: {
        type: Number,
        required: true
    },
    // Replace single owner with multiple owners
    owners: {
        type: [ownershipSchema],
        required: true,
        validate: {
            validator: function(owners) {
                // Check if owners exist
                if (!owners || owners.length === 0) return false;
                
                // Calculate total percentage
                const totalPercentage = owners.reduce((sum, owner) => sum + owner.percentage, 0);
                
                // Ensure total is 100%
                return totalPercentage === 100;
            },
            message: 'Total ownership percentage must be 100%'
        }
    },
    // Replace simple arrays with detailed update tracking
    updates: {
        type: [updateSchema],
        default: []
    },
    transactionHash: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, 
{ 
    collection: 'certificateData', 
    versionKey: false, 
    timestamps: true 
});

// Add index for efficient queries
certificateDataSchema.index({ 'owners.walletAddress': 1 });

const CertificateData = mongoose.model('CertificateData', certificateDataSchema);

module.exports = CertificateData;
