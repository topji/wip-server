const mongoose = require('mongoose');

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
    timestamp: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true,
        lowercase: true
    },
    updates: [{
        type: String
    }],
    metadataUpdates: [{
        type: String
    }],
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

const CertificateData = mongoose.model('CertificateData', certificateDataSchema);

module.exports = CertificateData;
