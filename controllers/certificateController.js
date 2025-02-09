const { wipContractInstance } = require('../contract/contract');
const { CertificateData } = require('../models');

const certificateController = {
    // Create a new certificate
    createCertificate: async (req, res) => {
        try {
            const { fileHash, metadataURI, userAddress } = req.body;
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.createCertificate(
                fileHash,
                metadataURI,
                userAddress
            );

            // Wait for transaction receipt
            const receipt = await tx.wait();
            console.log(receipt);
            
            // // Find the CertificateCreated event in the receipt
            // const certificateCreatedEvent = receipt.logs.find(
            //     log => {
            //         try {
            //             return wipContract.interface.parseLog({
            //                 topics: log.topics,
            //                 data: log.data
            //             })?.name === 'CertificateCreated'
            //         } catch (e) {
            //             return false;
            //         }
            //     }
            // );

            // if (!certificateCreatedEvent) {
            //     throw new Error('Certificate creation event not found in transaction receipt');
            // }

            // // Parse the event data
            // const eventData = wipContract.interface.parseLog({
            //     topics: certificateCreatedEvent.topics,
            //     data: certificateCreatedEvent.data
            // });

            const certificateId = parseInt(await wipContract.certificateCounter());
            console.log(certificateId);
            const certificateDetails = await wipContract.getCertificateDetails(certificateId);
            console.log(certificateDetails);
            const timestamp = parseInt(certificateDetails.timestamp);
            console.log(timestamp);

            // Save to MongoDB
            await CertificateData.create({
                certificateId,
                fileHash,
                metadataURI,
                timestamp: timestamp,
                owner: userAddress.toLowerCase(),
                updates: [],
                metadataUpdates: [],
                transactionHash: tx.hash
            });
            console.log("certificateData");

            res.status(200).json({
                success: true,
                message: "Certificate created successfully",
                transaction: tx.hash,
                certificateId
            });
        } catch (error) {
            console.error('Certificate creation error:', error);
            res.status(500).json({
                success: false,
                message: "Error creating certificate",
                error: error.message
            });
        }
    },

    // Update an existing certificate
    updateCertificate: async (req, res) => {
        try {
            const { certificateId, updatedFileHash, updatedMetadataURI } = req.body;
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.updateCertificate(
                certificateId,
                updatedFileHash,
                updatedMetadataURI
            );

            await tx.wait();

            // Get current certificate data
            const certificate = await CertificateData.findOne({ certificateId });
            
            // Update in MongoDB
            await CertificateData.findOneAndUpdate(
                { certificateId },
                {
                    $push: {
                        updates: updatedFileHash,
                        metadataUpdates: updatedMetadataURI
                    },
                    transactionHash: tx.hash
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Certificate updated successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error updating certificate",
                error: error.message
            });
        }
    },

    // Get certificate details
    getCertificateDetails: async (req, res) => {
        try {
            const { certificateId } = req.params;
            const { wipContract } = wipContractInstance();

            // Get data from both blockchain and MongoDB
            const [blockchainData, mongoData] = await Promise.all([
                wipContract.getCertificateDetails(certificateId),
                CertificateData.findOne({ certificateId })
            ]);

            res.status(200).json({
                success: true,
                data: {
                    id: blockchainData.id.toString(),
                    fileHash: blockchainData.fileHash,
                    metadataURI: blockchainData.metadataURI,
                    timestamp: blockchainData.timestamp.toString(),
                    owner: blockchainData.certOwner,
                    updates: blockchainData.updates,
                    metadataUpdates: blockchainData.metadataUpdates,
                    transactionHash: mongoData?.transactionHash
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching certificate details",
                error: error.message
            });
        }
    },

    // Transfer certificate ownership
    transferCertificate: async (req, res) => {
        try {
            const { certificateId, newOwner } = req.body;
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.transferCertificateOwnership(
                certificateId,
                newOwner
            );

            await tx.wait();

            // Update ownership in MongoDB
            await CertificateData.findOneAndUpdate(
                { certificateId },
                { 
                    owner: newOwner.toLowerCase(),
                    transactionHash: tx.hash
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Certificate ownership transferred successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error transferring certificate ownership",
                error: error.message
            });
        }
    },

    // Get all certificates for a user
    getUserCertificates: async (req, res) => {
        try {
            const { userAddress } = req.params;
            const { wipContract } = wipContractInstance();

            const certificates = await wipContract.getCertificatesByUser(userAddress);

            res.status(200).json({
                success: true,
                data: certificates.map(cert => cert.toString())
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching user certificates",
                error: error.message
            });
        }
    }
};

module.exports = certificateController;
