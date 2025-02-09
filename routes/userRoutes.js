const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register new user
router.post('/register', userController.registerUser);

// Update user information
router.post('/update', userController.updateUser);

// Get user data
router.get('/:userAddress', userController.getUserData);

// Get user certificates
router.get('/:userAddress/certificates', userController.getUserCertificates);

// Check if user exists
router.get('/isUser/:userAddress', userController.isUser);

module.exports = router;
