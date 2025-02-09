const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

// Create new certificate
router.post('/create', certificateController.createCertificate);

// Update certificate
router.post('/update', certificateController.updateCertificate);

// Get certificate details
router.get('/:certificateId', certificateController.getCertificateDetails);

// Transfer certificate ownership
router.post('/transfer', certificateController.transferCertificate);

// Get user certificates
router.get('/user/:userAddress', certificateController.getUserCertificates);

module.exports = router;
