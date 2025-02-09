const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    company: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    userAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    certificateIds: [{
        type: Number
    }],
    transactionHash: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, 
{ 
    collection: 'userData', 
    versionKey: false, 
    timestamps: true 
});

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = { UserData };
